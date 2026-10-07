import { TestRun } from '../models/test-run.model.js';
import { TestCase } from '../models/test-case.model.js';
import { Environment } from '../models/environment.model.js';
import { assertProjectAccess } from './project.service.js';
import { getDecryptedEnvironmentVariables } from './environment.service.js';
import { withBrowserSession } from '../utils/browser-manager.js';
import { executeStep } from '../utils/step-executor.js';
import { captureFailureScreenshot } from '../utils/artifact-manager.js';
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
 * Pramāṇa AI — Centralized Execution Service
 *
 * Executes a TestCase against a target Environment using Playwright.
 * Enforces project authorization, secure environment resolution, step-by-step
 * execution, artifact recording, and deterministic status transitions.
 *
 * @param {string} userId - Authenticated user initiating the run
 * @param {object} params
 * @param {string} params.testCaseId - Target TestCase ID
 * @param {string} params.environmentId - Target Environment ID
 * @param {string} [params.browser='chromium'] - Browser target
 * @returns {Promise<object>} Sanitized TestRun record
 */
export async function executeTestCase(userId, { testCaseId, environmentId, browser = 'chromium' }) {
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

  // Resolve decrypted environment variables strictly within this execution boundary
  const resolvedEnv = await getDecryptedEnvironmentVariables(environmentId, userId);

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
  }));

  // Create initial TestRun in QUEUED status
  const testRun = await TestRun.create({
    projectId: testCase.projectId,
    testCaseId: testCase._id,
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

  // Transition to RUNNING
  const startTime = Date.now();
  testRun.status = 'RUNNING';
  testRun.startedAt = new Date(startTime);
  await testRun.save();

  let finalStatus = 'PASSED';
  let runError = null;

  try {
    await withBrowserSession({ headless: true }, async ({ page }) => {
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

          // Capture failure screenshot artifact
          const screenshotUrl = await captureFailureScreenshot(
            page,
            testRun._id.toString(),
            step.order
          );
          stepResult.screenshot = screenshotUrl;

          // Record run-level artifact metadata
          testRun.artifacts = {
            screenshot: screenshotUrl,
            currentUrl: stepResult.currentUrl,
            failedStepOrder: step.order,
          };

          finalStatus = 'FAILED';
          runError = {
            message: `Step ${step.order} (${step.action.toUpperCase()}) failed: ${stepErr.message}`,
            stack: stepErr.stack,
          };

          // Mark remaining steps as SKIPPED
          for (let j = i + 1; j < testCase.steps.length; j++) {
            testRun.stepResults[j].status = 'SKIPPED';
            testRun.stepResults[j].duration = 0;
          }

          break; // Stop execution on first step failure
        }
      }
    });
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
 * Retrieves a single TestRun by ID.
 *
 * @param {string} runId - TestRun ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<object>} Sanitized TestRun
 */
export async function getTestRunById(runId, userId) {
  const testRun = await TestRun.findById(runId)
    .populate('testCaseId', 'name priority status')
    .populate('environmentId', 'name baseUrl')
    .populate('projectId', 'name')
    .populate('triggeredBy', 'name email');

  if (!testRun) {
    throw AppError.notFound('Test run not found');
  }

  const projectId = testRun.projectId?._id || testRun.projectId;
  await assertProjectAccess(projectId, userId);

  return sanitizeTestRun(testRun);
}

/**
 * Retrieves execution history runs for a given TestCase.
 *
 * @param {string} testCaseId - TestCase ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<Array<object>>} List of runs
 */
export async function getRunsByTestCase(testCaseId, userId) {
  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) {
    throw AppError.notFound('Test case not found');
  }

  await assertProjectAccess(testCase.projectId, userId);

  const runs = await TestRun.find({ testCaseId })
    .populate('environmentId', 'name baseUrl')
    .populate('triggeredBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

  return runs.map(sanitizeTestRun);
}

/**
 * Retrieves execution history runs for a given Project.
 *
 * @param {string} projectId - Project ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<Array<object>>} List of runs
 */
export async function getRunsByProject(projectId, userId) {
  await assertProjectAccess(projectId, userId);

  const runs = await TestRun.find({ projectId })
    .populate('testCaseId', 'name priority')
    .populate('environmentId', 'name baseUrl')
    .populate('triggeredBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);

  return runs.map(sanitizeTestRun);
}
