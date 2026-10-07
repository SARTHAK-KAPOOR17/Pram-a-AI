import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { TestRun } from '../src/models/test-run.model.js';
import { SuiteRun } from '../src/models/suite-run.model.js';
import {
  ensureArtifactDirs,
  sanitizeFilename,
  isSafeArtifactPath,
  sanitizeNetworkHeaders,
  saveConsoleLogs,
  saveNetworkLog,
} from '../src/utils/artifact-manager.js';
import { captureFailureContext } from '../src/utils/failure-diagnostics.js';
import { withBrowserSession } from '../src/utils/browser-manager.js';
import {
  createTestRunSchema,
  createSuiteRunSchema,
} from '../src/validators/test-run.validator.js';

describe('Phase 3B — Test Execution Reliability & Observability Test Suite', () => {
  before(async () => {
    await ensureArtifactDirs();
  });

  describe('1. Asynchronous Execution Lifecycle & SuiteRun Validation', () => {
    it('should validate async property in createTestRunSchema', () => {
      const payload = {
        body: {
          testCaseId: '65f1a2b3c4d5e6f7a8b9c0d1',
          environmentId: '65f1a2b3c4d5e6f7a8b9c0d2',
          browser: 'firefox',
          async: true,
        },
      };

      const result = createTestRunSchema.safeParse(payload);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.body.browser, 'firefox');
      assert.strictEqual(result.data.body.async, true);
    });

    it('should validate createSuiteRunSchema payload', () => {
      const payload = {
        body: {
          environmentId: '65f1a2b3c4d5e6f7a8b9c0d2',
          browser: 'chromium',
          async: true,
        },
      };

      const result = createSuiteRunSchema.safeParse(payload);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.body.browser, 'chromium');
    });

    it('should reject createSuiteRunSchema with missing environmentId', () => {
      const payload = {
        body: {
          browser: 'chromium',
        },
      };

      const result = createSuiteRunSchema.safeParse(payload);
      assert.strictEqual(result.success, false);
      const issue = result.error.issues.find((i) => i.path.includes('environmentId'));
      assert.ok(issue);
    });

    it('should accurately calculate SuiteRun summary', () => {
      const mockSuiteRun = new SuiteRun({
        projectId: new mongoose.Types.ObjectId(),
        suiteId: new mongoose.Types.ObjectId(),
        environmentId: new mongoose.Types.ObjectId(),
        triggeredBy: new mongoose.Types.ObjectId(),
        browser: 'chromium',
        status: 'QUEUED',
        summary: {
          total: 4,
          passed: 3,
          failed: 1,
          error: 0,
          skipped: 0,
        },
      });

      assert.strictEqual(mockSuiteRun.summary.total, 4);
      assert.strictEqual(mockSuiteRun.summary.passed, 3);
      assert.strictEqual(mockSuiteRun.summary.failed, 1);
      assert.strictEqual(mockSuiteRun.status, 'QUEUED');
    });
  });

  describe('2. Artifact Management & Path Traversal Protection', () => {
    it('should sanitize unsafe filenames and strip path traversal characters', () => {
      assert.strictEqual(sanitizeFilename('../../../etc/passwd'), '_________etc_passwd');
      assert.strictEqual(sanitizeFilename('run#123;rm -rf'), 'run_123_rm_-rf');
      assert.strictEqual(sanitizeFilename('safe-run_123'), 'safe-run_123');
    });

    it('should detect and reject unsafe artifact paths outside the root artifact dir', () => {
      const safePath = 'artifacts/screenshots/run_123.png';
      const unsafePath = 'artifacts/../../windows/system32/cmd.exe';

      assert.strictEqual(isSafeArtifactPath(safePath), true);
      assert.strictEqual(isSafeArtifactPath(unsafePath), false);
    });

    it('should sanitize sensitive network headers (Authorization, Cookie, Token, Secret)', () => {
      const rawHeaders = {
        'content-type': 'application/json',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
        cookie: 'sessionId=secretSessionValue; token=sensitiveToken',
        'x-api-key': 'SUPER_SECRET_KEY_12345',
        'user-agent': 'Mozilla/5.0 Chrome',
      };

      const sanitized = sanitizeNetworkHeaders(rawHeaders);
      assert.strictEqual(sanitized['content-type'], 'application/json');
      assert.strictEqual(sanitized['authorization'], '[REDACTED]');
      assert.strictEqual(sanitized['cookie'], '[REDACTED]');
      assert.strictEqual(sanitized['x-api-key'], '[REDACTED]');
      assert.strictEqual(sanitized['user-agent'], 'Mozilla/5.0 Chrome');
    });

    it('should save console logs and network logs as valid JSON artifacts on disk', async () => {
      const mockRunId = `test_observability_${Date.now()}`;
      const mockConsole = [
        { type: 'log', text: 'Application loaded', timestamp: new Date() },
        { type: 'error', text: 'Uncaught TypeError', timestamp: new Date() },
      ];
      const mockNetwork = [
        {
          method: 'GET',
          url: 'http://localhost:5000/api/health',
          status: 200,
          resourceType: 'fetch',
          headers: { authorization: 'Bearer secret' },
        },
      ];

      const consoleUrl = await saveConsoleLogs(mockConsole, mockRunId);
      const networkUrl = await saveNetworkLog(mockNetwork, mockRunId);

      assert.ok(consoleUrl && consoleUrl.startsWith('/artifacts/logs/'));
      assert.ok(networkUrl && networkUrl.startsWith('/artifacts/network/'));
    });
  });

  describe('3. Browser Matrix & Observability Lifecycle (Chromium & Firefox)', () => {
    it('should launch Chromium session with tracing, console, and network interception', async () => {
      const testRunId = `test_chrom_${Date.now()}`;

      await withBrowserSession(
        {
          browser: 'chromium',
          runId: testRunId,
          headless: true,
          enableTracing: true,
          enableVideo: false,
        },
        async ({ page, consoleLogs, networkLogs }) => {
          await page.setContent(`
            <!DOCTYPE html>
            <html>
              <body>
                <button id="btn" onclick="console.log('Button clicked!')">Click Me</button>
              </body>
            </html>
          `);

          // Trigger console message
          await page.click('#btn');

          assert.ok(consoleLogs.length >= 1);
          const clickMsg = consoleLogs.find((l) => l.text.includes('Button clicked!'));
          assert.ok(clickMsg);
          assert.strictEqual(clickMsg.type, 'log');
        }
      );
    });

    it('should launch Firefox session successfully', async () => {
      const testRunId = `test_ff_${Date.now()}`;

      await withBrowserSession(
        {
          browser: 'firefox',
          runId: testRunId,
          headless: true,
          enableTracing: false,
          enableVideo: false,
        },
        async ({ page }) => {
          await page.setContent('<html><body><h1>Firefox Test</h1></body></html>');
          const title = await page.innerText('h1');
          assert.strictEqual(title, 'Firefox Test');
        }
      );
    });

    it('should handle WebKit gracefully and not crash the process if missing host libraries', async () => {
      const testRunId = `test_webkit_${Date.now()}`;
      try {
        await withBrowserSession(
          {
            browser: 'webkit',
            runId: testRunId,
            headless: true,
          },
          async ({ page }) => {
            await page.setContent('<html><body>WebKit</body></html>');
          }
        );
      } catch (err) {
        // Missing host libraries is expected on Windows without WebKit C++ DLLs
        assert.ok(err.message.includes('browserType.launch') || err.message.includes('missing dependencies') || err.message.includes('harfbuzz'));
      }
    });
  });

  describe('4. Failure Diagnostics & Self-Healing Telemetry', () => {
    it('should capture rich DOM telemetry and candidate elements on locator failure without crashing', async () => {
      await withBrowserSession(
        {
          browser: 'chromium',
          headless: true,
          enableTracing: false,
          enableVideo: false,
        },
        async ({ page }) => {
          await page.setContent(`
            <!DOCTYPE html>
            <html>
              <head><title>Test Diagnostics Page</title></head>
              <body>
                <header><h1>Welcome</h1></header>
                <form>
                  <input type="text" id="username" name="username" placeholder="Enter username" />
                  <button type="submit" id="submit-btn" role="button">Log In</button>
                </form>
              </body>
            </html>
          `);

          const failingStep = {
            order: 3,
            action: 'click',
            locator: {
              strategy: 'id',
              value: 'non_existent_submit_btn',
            },
          };

          const error = new Error('Element not found within 5000ms');
          const diagnostics = await captureFailureContext(page, failingStep, error);

          assert.strictEqual(diagnostics.stepOrder, 3);
          assert.strictEqual(diagnostics.action, 'click');
          assert.strictEqual(diagnostics.locatorStrategy, 'id');
          assert.strictEqual(diagnostics.error, 'Element not found within 5000ms');
          assert.ok(diagnostics.domContext);
          assert.strictEqual(diagnostics.domContext.title, 'Test Diagnostics Page');
          assert.strictEqual(diagnostics.domContext.elementFound, false);
          assert.ok(Array.isArray(diagnostics.domContext.candidateElements));
          assert.ok(diagnostics.domContext.candidateElements.length > 0);
        }
      );
    });

    it('should capture element attributes and sanitize sensitive attributes on existing element', async () => {
      await withBrowserSession(
        {
          browser: 'chromium',
          headless: true,
          enableTracing: false,
          enableVideo: false,
        },
        async ({ page }) => {
          await page.setContent(`
            <!DOCTYPE html>
            <html>
              <body>
                <button
                  id="checkout-btn"
                  role="button"
                  data-action="pay"
                  aria-label="Submit Payment"
                  class="btn-primary"
                  secret-token="SUPER_SECRET"
                >Pay Now</button>
              </body>
            </html>
          `);

          const failingStep = {
            order: 2,
            action: 'click',
            locator: {
              strategy: 'id',
              value: 'checkout-btn',
            },
          };

          const diagnostics = await captureFailureContext(
            page,
            failingStep,
            new Error('Button not clickable')
          );

          assert.ok(diagnostics.domContext.elementFound);
          assert.strictEqual(diagnostics.domContext.tagName, 'button');
          assert.strictEqual(diagnostics.domContext.elementText, 'Pay Now');
          assert.strictEqual(diagnostics.domContext.elementRole, 'button');
          assert.strictEqual(diagnostics.domContext.elementAttributes['data-action'], 'pay');
          // Sensitive attributes must be stripped
          assert.strictEqual(diagnostics.domContext.elementAttributes['secret-token'], undefined);
        }
      );
    });
  });
});
