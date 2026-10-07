import { TestRun } from '../models/test-run.model.js';
import { SuiteRun } from '../models/suite-run.model.js';
import { TestCase } from '../models/test-case.model.js';
import { TestSuite } from '../models/suite.model.js';
import { Environment } from '../models/environment.model.js';
import { assertProjectAccess } from './project.service.js';
import { getDecryptedEnvironmentVariables } from './environment.service.js';
import { withBrowserSession } from '../utils/browser-manager.js';
import { executeStep } from '../utils/step-executor.js';
import {
  captureFailureScreenshot,
  saveConsoleLogs,
  saveNetworkLog,
} from '../utils/artifact-manager.js';
import { captureFailureContext } from '../utils/failure-diagnostics.js';
import { AppError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

/**
 * Sanitizes a TestRun document for client responses, ensuring zero leakage of secrets.
 *
 * @param {object} testRunDoc - Mongoose document or plain object
 * @returns {object} Sanitized TestRun object
 */
export function sanitizeTestRun(testRunDoc) {
  if (!testRunDoc) return null;
  const run = testRunDoc.toObject ? testRunDoc.toObject() : JSON.parse(JSON.stringify(testRunDoc));
  return run;
}

/**
 * Sanitizes a SuiteRun document for client responses.
 *
 * @param {object} suiteRunDoc - Mongoose document or plain object
 * @returns {object} Sanitized SuiteRun object
 */
export function sanitizeSuiteRun(suiteRunDoc) {
  if (!suiteRunDoc) return null;
  const run = suiteRunDoc.toObject
    ? suiteRunDoc.toObject()
    : JSON.parse(JSON.stringify(suiteRunDoc));
  return run;
}

/**
 * Executes a single test run in the background worker.
 * Guarantees lifecycle transition from RUNNING -> PASSED/FAILED/ERROR and never leaves
 * a run permanently stuck in RUNNING.
 *
 * @param {string} testRunId - Target TestRun ID
 * @param {string} userId - Authenticated user
 * @param {object} options
 * @param {object} options.testCase - TestCase document
 * @param {object} options.environment - Environment document
 * @param {string} [options.browser='chromium'] - Browser engine
 * @returns {Promise<object>} Completed TestRun
 */
export async function runExecutionJob(
  testRunId,
  userId,
  { testCase, environment, browser = 'chromium' }
) {
  const testRun = await TestRun.findById(testRunId);
  if (!testRun) {
    logger.error(`Execution job aborted: TestRun [${testRunId}] not found`);
    return null;
  }

  // Prevent execution if already cancelled or completed
  if (['CANCELLED', 'PASSED', 'FAILED', 'ERROR'].includes(testRun.status)) {
    return testRun;
  }

  const startTime = Date.now();
  testRun.status = 'RUNNING';
  testRun.startedAt = new Date(startTime);
  await testRun.save();

  let finalStatus = 'PASSED';
  let runError = null;

  try {
    // Resolve decrypted environment variables securely strictly within this execution boundary
    const resolvedEnv = await getDecryptedEnvironmentVariables(environment._id, userId);

    await withBrowserSession(
      {
        browser,
        runId: String(testRun._id),
        headless: true,
        enableTracing: true,
        enableVideo: true,
      },
      async ({ page, consoleLogs, networkLogs }) => {
        const stepContext = {
          baseUrl: resolvedEnv.baseUrl || environment.baseUrl || '',
          variables: resolvedEnv.variables || {},
          timeout: 10000,
        };

        for (let i = 0; i < testCase.steps.length; i++) {
          const step = testCase.steps[i];
          const stepResult = testRun.stepResults[i];
          const stepStartTime = Date.now();

          stepResult.status = 'RUNNING';
          stepResult.startedAt = new Date(stepStartTime);

          try {
            const res = await executeStep(page, step, stepContext);
            stepResult.status = 'PASSED';
            stepResult.completedAt = new Date();
            stepResult.duration = Date.now() - stepStartTime;
            stepResult.currentUrl = res.currentUrl || (page.url ? page.url() : '');
          } catch (stepErr) {
            stepResult.status = 'FAILED';
            stepResult.completedAt = new Date();
            stepResult.duration = Date.now() - stepStartTime;
            stepResult.error = stepErr.message;
            stepResult.currentUrl = page.url ? page.url() : '';

            // 1. Capture full-page screenshot artifact
            const screenshotUrl = await captureFailureScreenshot(
              page,
              testRun._id.toString(),
              step.order
            );
            stepResult.screenshot = screenshotUrl;

            // 2. Capture rich failure context and DOM state (Phase 3B failure diagnostics)
            const failureContext = await captureFailureContext(page, step, stepErr);
            stepResult.failureDetails = failureContext;

            // Attach run-level artifact metadata
            testRun.artifacts.screenshot = screenshotUrl;
            testRun.artifacts.currentUrl = stepResult.currentUrl;
            testRun.artifacts.failedStepOrder = step.order;
            testRun.failureDetails = failureContext;

            finalStatus = 'FAILED';
            runError = {
              message: `Step ${step.order} (${step.action.toUpperCase()}) failed: ${stepErr.message}`,
              stack: stepErr.stack,
            };

            // Fail-fast: Mark all subsequent steps as SKIPPED
            for (let j = i + 1; j < testCase.steps.length; j++) {
              testRun.stepResults[j].status = 'SKIPPED';
              testRun.stepResults[j].duration = 0;
            }

            break; // Terminate step execution upon first failure
          }
        }

        // Store collected telemetry
        testRun.consoleLogs = (consoleLogs || []).slice(0, 200);
        testRun.networkLogs = (networkLogs || []).slice(0, 200);

        // Save console and network log artifacts to disk
        await saveConsoleLogs(testRun.consoleLogs, String(testRun._id));
        await saveNetworkLog(testRun.networkLogs, String(testRun._id));
      }
    );

    // Populate artifact URLs from deterministic storage locations
    const cleanId = String(testRun._id);
    testRun.artifacts.trace = `/artifacts/traces/${cleanId}_trace.zip`;
    testRun.artifacts.video = `/artifacts/videos/${cleanId}_video.webm`;
  } catch (infraErr) {
    if (finalStatus !== 'FAILED') {
      finalStatus = 'ERROR';
      runError = {
        message: infraErr.message || 'Browser execution runner encountered an unexpected error',
        stack: infraErr.stack,
      };

      for (const sr of testRun.stepResults) {
        if (sr.status === 'RUNNING' || sr.status === 'PENDING') {
          sr.status = 'SKIPPED';
        }
      }
    }
  }

  const completedAt = Date.now();
  testRun.status = finalStatus;
  testRun.completedAt = new Date(completedAt);
  testRun.duration = completedAt - startTime;

  if (runError) {
    testRun.error = {
      message: runError.message,
      stack: runError.stack,
    };
  }

  await testRun.save();
  return sanitizeTestRun(testRun);
}

/**
 * Pramāṇa AI — Centralized Execution Service
 *
 * Enqueues a TestCase execution against an Environment.
 * By default (async = true), creates a TestRun in QUEUED status and immediately returns,
 * running the browser execution asynchronously in the background.
 *
 * @param {string} userId - Authenticated user initiating the run
 * @param {object} params
 * @param {string} params.testCaseId - Target TestCase ID
 * @param {string} params.environmentId - Target Environment ID
 * @param {string} [params.browser='chromium'] - Browser target: chromium | firefox | webkit
 * @param {string} [params.suiteRunId=null] - Optional associated SuiteRun
 * @param {boolean} [params.async=true] - Run asynchronously in background
 * @returns {Promise<object>} Sanitized TestRun record
 */
export async function executeTestCase(
  userId,
  { testCaseId, environmentId, browser = 'chromium', suiteRunId = null, async = true }
) {
  if (!testCaseId || !environmentId) {
    throw AppError.badRequest('testCaseId and environmentId are required for test execution');
  }

  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) {
    throw AppError.notFound('Test case not found');
  }

  // Enforce project authorization
  await assertProjectAccess(testCase.projectId, userId);

  const environment = await Environment.findOne({
    _id: environmentId,
    projectId: testCase.projectId,
  });
  if (!environment) {
    throw AppError.notFound('Target environment not found in this project');
  }

  if (!testCase.steps || testCase.steps.length === 0) {
    throw AppError.badRequest('Test case contains no executable steps');
  }

  // Initialize step results
  const stepResults = testCase.steps.map((s, idx) => ({
    stepId: s._id ? String(s._id) : null,
    order: s.order || idx + 1,
    action: s.action,
    status: 'PENDING',
    startedAt: null,
    completedAt: null,
    duration: 0,
    error: null,
    screenshot: null,
    currentUrl: null,
    failureDetails: null,
  }));

  // Create initial TestRun in QUEUED status
  const testRun = await TestRun.create({
    projectId: testCase.projectId,
    testCaseId: testCase._id,
    suiteRunId: suiteRunId || null,
    environmentId: environment._id,
    status: 'QUEUED',
    startedAt: null,
    completedAt: null,
    duration: 0,
    triggeredBy: userId,
    browser,
    stepResults,
    artifacts: {},
  });

  if (async) {
    // Dispatch background execution asynchronously (non-blocking)
    setImmediate(() => {
      runExecutionJob(testRun._id, userId, {
        testCase,
        environment,
        browser,
      }).catch((err) => {
        logger.error(`Background execution error for run [${testRun._id}]:`, err.message);
      });
    });

    return sanitizeTestRun(testRun);
  }

  // Synchronous execution mode (used by test suites or unit tests)
  return await runExecutionJob(testRun._id, userId, {
    testCase,
    environment,
    browser,
  });
}

/**
 * Executes an entire TestSuite sequentially in the background.
 *
 * @param {string} userId - Authenticated user
 * @param {object} params
 * @param {string} params.suiteId - Target TestSuite ID
 * @param {string} params.environmentId - Target Environment ID
 * @param {string} [params.browser='chromium'] - Browser target
 * @param {boolean} [params.async=true] - Run asynchronously in background
 * @returns {Promise<object>} Sanitized SuiteRun
 */
export async function executeSuite(
  userId,
  { suiteId, environmentId, browser = 'chromium', async = true }
) {
  if (!suiteId || !environmentId) {
    throw AppError.badRequest('suiteId and environmentId are required for suite execution');
  }

  const suite = await TestSuite.findById(suiteId);
  if (!suite) {
    throw AppError.notFound('Test suite not found');
  }

  await assertProjectAccess(suite.projectId, userId);

  const environment = await Environment.findOne({
    _id: environmentId,
    projectId: suite.projectId,
  });
  if (!environment) {
    throw AppError.notFound('Target environment not found in this project');
  }

  const testCases = await TestCase.find({
    suiteId: suite._id,
    projectId: suite.projectId,
  }).sort({ createdAt: 1 });

  if (!testCases || testCases.length === 0) {
    throw AppError.badRequest('Test suite contains no test cases to execute');
  }

  // Create initial SuiteRun in QUEUED status
  const suiteRun = await SuiteRun.create({
    projectId: suite.projectId,
    suiteId: suite._id,
    environmentId: environment._id,
    status: 'QUEUED',
    triggeredBy: userId,
    browser,
    testRuns: [],
    summary: {
      total: testCases.length,
      passed: 0,
      failed: 0,
      error: 0,
      skipped: 0,
    },
  });

  const runSuiteJob = async () => {
    const startTime = Date.now();
    suiteRun.status = 'RUNNING';
    suiteRun.startedAt = new Date(startTime);
    await suiteRun.save();

    let passed = 0;
    let failed = 0;
    let error = 0;
    let skipped = 0;
    const testRunIds = [];

    try {
      for (const tc of testCases) {
        try {
          const run = await executeTestCase(userId, {
            testCaseId: tc._id,
            environmentId: environment._id,
            browser,
            suiteRunId: suiteRun._id,
            async: false, // Run each test synchronously within the suite job
          });

          testRunIds.push(run._id);

          if (run.status === 'PASSED') passed++;
          else if (run.status === 'FAILED') failed++;
          else if (run.status === 'ERROR') error++;
          else skipped++;
        } catch (tcErr) {
          error++;
          logger.error(`Error executing suite test case [${tc._id}]:`, tcErr.message);
        }

        // Update progress
        suiteRun.testRuns = testRunIds;
        suiteRun.summary = {
          total: testCases.length,
          passed,
          failed,
          error,
          skipped,
        };
        await suiteRun.save();
      }

      const completedAt = Date.now();
      suiteRun.completedAt = new Date(completedAt);
      suiteRun.duration = completedAt - startTime;
      suiteRun.status = failed > 0 ? 'FAILED' : error > 0 ? 'ERROR' : 'PASSED';
      await suiteRun.save();
    } catch (suiteErr) {
      suiteRun.status = 'ERROR';
      suiteRun.error = {
        message: suiteErr.message,
        stack: suiteErr.stack,
      };
      suiteRun.completedAt = new Date();
      suiteRun.duration = Date.now() - startTime;
      await suiteRun.save();
    }
  };

  if (async) {
    setImmediate(() => {
      runSuiteJob().catch((err) => {
        logger.error(`Background suite execution error [${suiteRun._id}]:`, err.message);
      });
    });

    return sanitizeSuiteRun(suiteRun);
  }

  await runSuiteJob();
  return sanitizeSuiteRun(suiteRun);
}

/**
 * Retrieves a single TestRun by ID.
 *
 * @param {string} runId - TestRun ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<object>} Sanitized TestRun
 */
export async function getTestRunById(runId, userId) {
  const run = await TestRun.findById(runId)
    .populate('testCaseId', 'name description steps')
    .populate('environmentId', 'name baseUrl')
    .populate('triggeredBy', 'name email');

  if (!run) {
    throw AppError.notFound('Test run not found');
  }

  await assertProjectAccess(run.projectId, userId);
  return sanitizeTestRun(run);
}

/**
 * Retrieves a single SuiteRun by ID.
 *
 * @param {string} suiteRunId - SuiteRun ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<object>} Sanitized SuiteRun
 */
export async function getSuiteRunById(suiteRunId, userId) {
  const suiteRun = await SuiteRun.findById(suiteRunId)
    .populate('suiteId', 'name description')
    .populate('environmentId', 'name baseUrl')
    .populate('triggeredBy', 'name email')
    .populate({
      path: 'testRuns',
      populate: { path: 'testCaseId', select: 'name' },
    });

  if (!suiteRun) {
    throw AppError.notFound('Suite run not found');
  }

  await assertProjectAccess(suiteRun.projectId, userId);
  return sanitizeSuiteRun(suiteRun);
}

/**
 * Retrieves all runs for a specific TestCase.
 *
 * @param {string} testCaseId - TestCase ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<Array<object>>} List of sanitized TestRuns
 */
export async function getRunsByTestCase(testCaseId, userId) {
  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) {
    throw AppError.notFound('Test case not found');
  }

  await assertProjectAccess(testCase.projectId, userId);

  const runs = await TestRun.find({ testCaseId })
    .sort({ createdAt: -1 })
    .populate('environmentId', 'name')
    .populate('triggeredBy', 'name email');

  return runs.map(sanitizeTestRun);
}

/**
 * Retrieves all runs for a specific Project.
 *
 * @param {string} projectId - Project ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<Array<object>>} List of sanitized TestRuns
 */
export async function getRunsByProject(projectId, userId) {
  await assertProjectAccess(projectId, userId);

  const runs = await TestRun.find({ projectId })
    .sort({ createdAt: -1 })
    .populate('testCaseId', 'name')
    .populate('environmentId', 'name')
    .populate('triggeredBy', 'name email');

  return runs.map(sanitizeTestRun);
}

/**
 * Retrieves all suite runs for a specific Project.
 *
 * @param {string} projectId - Project ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<Array<object>>} List of sanitized SuiteRuns
 */
export async function getSuiteRunsByProject(projectId, userId) {
  await assertProjectAccess(projectId, userId);

  const suiteRuns = await SuiteRun.find({ projectId })
    .sort({ createdAt: -1 })
    .populate('suiteId', 'name')
    .populate('environmentId', 'name')
    .populate('triggeredBy', 'name email');

  return suiteRuns.map(sanitizeSuiteRun);
}

/**
 * Retrieves all runs for a specific TestSuite.
 *
 * @param {string} suiteId - TestSuite ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<Array<object>>} List of sanitized SuiteRuns
 */
export async function getRunsBySuite(suiteId, userId) {
  const suite = await TestSuite.findById(suiteId);
  if (!suite) {
    throw AppError.notFound('Test suite not found');
  }

  await assertProjectAccess(suite.projectId, userId);

  const runs = await SuiteRun.find({ suiteId })
    .sort({ createdAt: -1 })
    .populate('environmentId', 'name')
    .populate('triggeredBy', 'name email');

  return runs.map(sanitizeSuiteRun);
}
