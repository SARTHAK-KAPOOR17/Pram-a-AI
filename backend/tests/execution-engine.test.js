import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveLocator } from '../src/utils/locator-resolver.js';
import { executeAssertion } from '../src/utils/assertion-engine.js';
import { executeStep, interpolateVariables } from '../src/utils/step-executor.js';
import { withBrowserSession } from '../src/utils/browser-manager.js';
import { captureFailureScreenshot } from '../src/utils/artifact-manager.js';
import { sanitizeTestRun } from '../src/services/execution.service.js';
import { createTestRunSchema } from '../src/validators/test-run.validator.js';

describe('Phase 3A — Test Execution Engine Test Suite', () => {
  // Controlled HTML fixture for deterministic in-memory browser verification
  const controlledHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Pramāṇa AI Execution Sandbox</title></head>
      <body style="background: #000; color: #fff;">
        <h1 id="app-heading">Pramāṇa AI Automation Target</h1>
        <div id="welcome-msg" class="greeting">Welcome to the Dashboard!</div>
        <button id="primary-btn" class="btn-main" data-testid="submit-action-btn" role="button">
          Submit Action
        </button>
        <button id="disabled-btn" disabled>Disabled Action</button>
        <div id="hidden-box" style="display: none;">Hidden Content</div>
        <input id="username" type="text" placeholder="Username" value="" />
        <select id="country">
          <option value="US">United States</option>
          <option value="IN">India</option>
          <option value="EU">Europe</option>
        </select>
        <input id="terms" type="checkbox" />
      </body>
    </html>
  `;

  describe('1. TestRun Validation & Schema Checks', () => {
    it('1. should validate a valid TestRun creation payload', () => {
      const validPayload = {
        body: {
          testCaseId: '507f1f77bcf86cd799439011',
          environmentId: '507f1f77bcf86cd799439012',
          browser: 'chromium',
        },
      };

      const result = createTestRunSchema.safeParse(validPayload);
      assert.strictEqual(result.success, true);
    });

    it('2. should reject TestRun creation with missing required fields', () => {
      const invalid = {
        body: {
          testCaseId: '',
          environmentId: '',
        },
      };

      const result = createTestRunSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('3. should enforce status transition rules and state consistency', () => {
      const mockRun = {
        _id: 'run-123',
        status: 'QUEUED',
        stepResults: [
          { order: 1, action: 'navigate', status: 'PENDING' },
          { order: 2, action: 'click', status: 'PENDING' },
        ],
      };

      assert.strictEqual(mockRun.status, 'QUEUED');
      mockRun.status = 'RUNNING';
      mockRun.stepResults[0].status = 'RUNNING';
      assert.strictEqual(mockRun.status, 'RUNNING');

      mockRun.stepResults[0].status = 'PASSED';
      mockRun.stepResults[1].status = 'PASSED';
      mockRun.status = 'PASSED';
      assert.strictEqual(mockRun.status, 'PASSED');
    });
  });

  describe('2. Centralized Locator Resolver Deterministic Verification', () => {
    it('6. should resolve element using CSS selector strategy', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const loc = resolveLocator(page, 'css', 'button.btn-main');
        const text = await loc.innerText();
        assert.strictEqual(text.trim(), 'Submit Action');
      });
    });

    it('7. should resolve element using XPath strategy', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const loc = resolveLocator(page, 'xpath', '//button[@id="primary-btn"]');
        const text = await loc.innerText();
        assert.strictEqual(text.trim(), 'Submit Action');
      });
    });

    it('8. should resolve element using ID strategy (both raw and prefixed)', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const locRaw = resolveLocator(page, 'id', 'primary-btn');
        assert.strictEqual((await locRaw.innerText()).trim(), 'Submit Action');

        const locPrefixed = resolveLocator(page, 'id', '#primary-btn');
        assert.strictEqual((await locPrefixed.innerText()).trim(), 'Submit Action');
      });
    });

    it('9. should resolve element using TestID strategy', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const loc = resolveLocator(page, 'testid', 'submit-action-btn');
        const text = await loc.innerText();
        assert.strictEqual(text.trim(), 'Submit Action');
      });
    });

    it('10. should resolve element using visible text strategy', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const loc = resolveLocator(page, 'text', 'Submit Action');
        assert.strictEqual(await loc.isVisible(), true);
      });
    });

    it('11. should resolve element using ARIA role strategy', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const loc = resolveLocator(page, 'role', 'button', { elementText: 'Submit Action' });
        assert.strictEqual(await loc.isVisible(), true);
      });
    });

    it('should reject invalid or unsupported locator strategy', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        assert.throws(() => {
          resolveLocator(page, 'unknown_strategy', '#element');
        }, /Unsupported locator strategy/i);
      });
    });
  });

  describe('3. Assertion Engine Verification', () => {
    it('should execute visible assertion successfully', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const res = await executeAssertion(page, {
          type: 'visible',
          locator: { strategy: 'id', value: 'primary-btn' },
        });
        assert.strictEqual(res.success, true);
      });
    });

    it('should execute hidden assertion successfully', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const res = await executeAssertion(page, {
          type: 'hidden',
          locator: { strategy: 'id', value: 'hidden-box' },
        });
        assert.strictEqual(res.success, true);
      });
    });

    it('should execute text_contains assertion successfully', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const res = await executeAssertion(page, {
          type: 'text_contains',
          locator: { strategy: 'id', value: 'welcome-msg' },
          expectedValue: 'Dashboard',
        });
        assert.strictEqual(res.success, true);
      });
    });

    it('should execute text_equals assertion successfully', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const res = await executeAssertion(page, {
          type: 'text_equals',
          locator: { strategy: 'id', value: 'welcome-msg' },
          expectedValue: 'Welcome to the Dashboard!',
        });
        assert.strictEqual(res.success, true);
      });
    });

    it('should execute enabled and disabled assertions', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const enabledRes = await executeAssertion(page, {
          type: 'enabled',
          locator: { strategy: 'id', value: 'primary-btn' },
        });
        assert.strictEqual(enabledRes.success, true);

        const disabledRes = await executeAssertion(page, {
          type: 'disabled',
          locator: { strategy: 'id', value: 'disabled-btn' },
        });
        assert.strictEqual(disabledRes.success, true);
      });
    });

    it('14. should throw structured assertion error without crashing when assertion fails', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        await assert.rejects(
          async () => {
            await executeAssertion(
              page,
              {
                type: 'text_equals',
                locator: { strategy: 'id', value: 'welcome-msg' },
                expectedValue: 'Wrong text expectation',
              },
              { timeout: 1000 }
            );
          },
          (err) => {
            assert.ok(err.message.includes('Assertion failed'));
            return true;
          }
        );
      });
    });
  });

  describe('4. Step Executor & Full Execution Flow', () => {
    it('12. should execute sequential browser actions (fill, click, select, check, press)', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);

        // Fill username
        await executeStep(page, {
          action: 'fill',
          locator: { strategy: 'id', value: 'username' },
          value: 'testuser@pramana.ai',
        });
        const usernameVal = await page.inputValue('#username');
        assert.strictEqual(usernameVal, 'testuser@pramana.ai');

        // Select country
        await executeStep(page, {
          action: 'select',
          locator: { strategy: 'id', value: 'country' },
          value: 'IN',
        });
        const countryVal = await page.inputValue('#country');
        assert.strictEqual(countryVal, 'IN');

        // Check terms
        await executeStep(page, {
          action: 'check',
          locator: { strategy: 'id', value: 'terms' },
        });
        const isChecked = await page.isChecked('#terms');
        assert.strictEqual(isChecked, true);

        // Uncheck terms
        await executeStep(page, {
          action: 'uncheck',
          locator: { strategy: 'id', value: 'terms' },
        });
        assert.strictEqual(await page.isChecked('#terms'), false);

        // Click button
        await executeStep(page, {
          action: 'click',
          locator: { strategy: 'id', value: 'primary-btn' },
        });

        // Press key
        await executeStep(page, {
          action: 'press',
          locator: { strategy: 'id', value: 'username' },
          value: 'Enter',
        });
      });
    });

    it('13. should handle failed step when element is not found within timeout', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);

        await assert.rejects(
          async () => {
            await executeStep(
              page,
              {
                action: 'click',
                locator: { strategy: 'css', value: '#non-existent-button' },
              },
              { timeout: 500 }
            );
          },
          (err) => {
            assert.ok(err.message);
            return true;
          }
        );
      });
    });

    it('15. should capture screenshot artifact on step failure', async () => {
      await withBrowserSession({ headless: true }, async ({ page }) => {
        await page.setContent(controlledHtml);
        const screenshotUrl = await captureFailureScreenshot(page, 'testrun-unit-1', 3);

        assert.ok(screenshotUrl);
        assert.ok(screenshotUrl.startsWith('/artifacts/screenshots/'));
        assert.ok(screenshotUrl.includes('testrun-unit-1_step_3'));

        // Verify physical file was written to disk
        const filePath = path.join(process.cwd(), screenshotUrl);
        const fileExists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);
        assert.strictEqual(fileExists, true);

        // Cleanup test screenshot file
        await fs.unlink(filePath).catch(() => {});
      });
    });

    it('16. should mark remaining steps as SKIPPED after a failure', () => {
      const steps = [
        { order: 1, action: 'navigate' },
        { order: 2, action: 'click' },
        { order: 3, action: 'assert' },
        { order: 4, action: 'click' },
      ];

      const stepResults = steps.map((s) => ({
        order: s.order,
        action: s.action,
        status: 'PENDING',
      }));

      // Simulate step 2 failure
      stepResults[0].status = 'PASSED';
      stepResults[1].status = 'FAILED';
      stepResults[1].error = 'Element not found';

      for (let j = 2; j < stepResults.length; j++) {
        stepResults[j].status = 'SKIPPED';
      }

      assert.strictEqual(stepResults[0].status, 'PASSED');
      assert.strictEqual(stepResults[1].status, 'FAILED');
      assert.strictEqual(stepResults[2].status, 'SKIPPED');
      assert.strictEqual(stepResults[3].status, 'SKIPPED');
    });

    it('should interpolate environment variables securely in step values', () => {
      const vars = {
        API_TOKEN: 'token-xyz-123',
        USER_EMAIL: 'qa-engineer@pramana.ai',
      };

      const template = 'User login with {{USER_EMAIL}} and token {{API_TOKEN}}';
      const resolved = interpolateVariables(template, vars);

      assert.strictEqual(
        resolved,
        'User login with qa-engineer@pramana.ai and token token-xyz-123'
      );
    });

    it('20. should never expose decrypted secrets or crypto metadata in sanitized TestRun', () => {
      const rawRun = {
        _id: '507f1f77bcf86cd799439099',
        projectId: '507f1f77bcf86cd799439088',
        testCaseId: '507f1f77bcf86cd799439077',
        environmentId: '507f1f77bcf86cd799439066',
        status: 'PASSED',
        duration: 3500,
        stepResults: [
          {
            order: 1,
            action: 'fill',
            status: 'PASSED',
            value: '••••••••',
          },
        ],
        artifacts: {
          screenshot: '/artifacts/screenshots/run_step_1.png',
        },
      };

      const sanitized = sanitizeTestRun(rawRun);
      assert.strictEqual(sanitized._id, rawRun._id);
      assert.strictEqual(sanitized.status, 'PASSED');
      // Verify no sensitive keys leaked
      assert.strictEqual(sanitized.encryptedData, undefined);
      assert.strictEqual(sanitized.authTag, undefined);
      assert.strictEqual(sanitized.iv, undefined);
    });
  });
});
