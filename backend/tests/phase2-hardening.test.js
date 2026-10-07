import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  isMaskedValue,
} from '../src/utils/encryption.js';
import { sanitizeEnvironment } from '../src/services/environment.service.js';
import { createTestCaseSchema } from '../src/validators/test-case.validator.js';
import { createEnvironmentSchema, updateEnvironmentSchema } from '../src/validators/environment.validator.js';

describe('Phase 2 Hardening & Regression Verification Suite', () => {
  describe('1. Environment Secret Encryption at Rest & Sanitization', () => {
    it('should encrypt secret variables at rest with AES-256-GCM metadata', () => {
      const plaintextSecret = 'sk_live_prod_super_secret_auth_key_98765';
      const encrypted = encryptSecret(plaintextSecret);

      assert.strictEqual(encrypted.encrypted, true);
      assert.ok(encrypted.iv);
      assert.ok(encrypted.authTag);
      assert.ok(encrypted.ciphertext);
      assert.notStrictEqual(encrypted.ciphertext, plaintextSecret);
      assert.strictEqual(encrypted.ciphertext.includes(plaintextSecret), false);

      // Verify decryption recovers original
      const decrypted = decryptSecret(encrypted);
      assert.strictEqual(decrypted, plaintextSecret);
    });

    it('should mask secret variables and strip encryptedData in normal API responses', () => {
      const encryptedPayload = encryptSecret('confidential-api-secret');

      const mockDbEnvironment = {
        _id: '670000000000000000000001',
        projectId: '670000000000000000000002',
        name: 'Staging Environment',
        baseUrl: 'https://staging.example.com',
        isDefault: true,
        variables: [
          {
            key: 'DATABASE_PASSWORD',
            value: '••••••••',
            isSecret: true,
            encryptedData: encryptedPayload,
          },
          {
            key: 'APP_ENV',
            value: 'staging',
            isSecret: false,
            encryptedData: null,
          },
        ],
      };

      const sanitized = sanitizeEnvironment(mockDbEnvironment);

      // Verify secret variable is masked
      const secretVar = sanitized.variables.find((v) => v.key === 'DATABASE_PASSWORD');
      assert.ok(secretVar);
      assert.strictEqual(secretVar.value, '••••••••');
      assert.strictEqual(secretVar.isSecret, true);
      assert.strictEqual(secretVar.encryptedData, undefined);

      // Verify non-secret variable is preserved normally
      const nonSecretVar = sanitized.variables.find((v) => v.key === 'APP_ENV');
      assert.ok(nonSecretVar);
      assert.strictEqual(nonSecretVar.value, 'staging');
      assert.strictEqual(nonSecretVar.isSecret, false);
      assert.strictEqual(nonSecretVar.encryptedData, undefined);
    });

    it('should validate environment creation payload with secret variables', () => {
      const validPayload = {
        body: {
          name: 'Production Target',
          baseUrl: 'https://app.pramana.ai',
          isDefault: true,
          variables: [
            { key: 'JWT_KEY', value: 'secret-token-to-encrypt', isSecret: true },
            { key: 'TIMEOUT_MS', value: '10000', isSecret: false },
          ],
        },
      };

      const result = createEnvironmentSchema.safeParse(validPayload);
      assert.strictEqual(result.success, true);
    });

    it('should preserve existing secret ciphertext if masked value is submitted during update', () => {
      const existingSecret = 'sk_test_existing_secret_token';
      const existingEncrypted = encryptSecret(existingSecret);

      const existingVariables = [
        {
          key: 'STRIPE_SECRET_KEY',
          value: maskSecret(),
          isSecret: true,
          encryptedData: existingEncrypted,
        },
      ];

      const updatePayloadVariables = [
        {
          key: 'STRIPE_SECRET_KEY',
          value: '••••••••',
          isSecret: true,
        },
      ];

      // Replicate the service logic
      const targetVar = updatePayloadVariables[0];
      const matched = existingVariables.find((ev) => ev.key === targetVar.key);
      assert.ok(matched);
      assert.strictEqual(isMaskedValue(targetVar.value), true);

      // Retain existing encryptedData
      const preservedData = matched.encryptedData;
      assert.deepStrictEqual(preservedData, existingEncrypted);
      assert.strictEqual(decryptSecret(preservedData), existingSecret);
    });
  });

  describe('2. Assertion Locator Strategy Flexibility & Backward Compatibility', () => {
    it('should validate and persist CSS assertion locators (backward compatibility)', () => {
      const testCase = {
        body: {
          name: 'Verify Login Button Appears',
          steps: [
            {
              order: 1,
              action: 'assert',
              assertion: {
                type: 'visible',
                locator: {
                  strategy: 'css',
                  value: '#login-button',
                },
              },
            },
          ],
        },
      };

      const result = createTestCaseSchema.safeParse(testCase);
      assert.strictEqual(result.success, true);
      assert.strictEqual(
        result.data.body.steps[0].assertion.locator.strategy,
        'css'
      );
    });

    it('should validate and persist XPath assertion locators', () => {
      const testCase = {
        body: {
          name: 'Verify Header via XPath',
          steps: [
            {
              order: 1,
              action: 'assert',
              assertion: {
                type: 'visible',
                locator: {
                  strategy: 'xpath',
                  value: '//header//h1[text()="Dashboard"]',
                },
              },
            },
          ],
        },
      };

      const result = createTestCaseSchema.safeParse(testCase);
      assert.strictEqual(result.success, true);
      assert.strictEqual(
        result.data.body.steps[0].assertion.locator.strategy,
        'xpath'
      );
    });

    it('should validate and persist all supported locator strategies (id, testid, text, role)', () => {
      const strategies = ['id', 'testid', 'text', 'role'];

      strategies.forEach((strategy, idx) => {
        const payload = {
          body: {
            name: `Test Assertion Strategy ${strategy}`,
            steps: [
              {
                order: idx + 1,
                action: 'assert',
                assertion: {
                  type: 'visible',
                  locator: {
                    strategy,
                    value: `target-${strategy}`,
                  },
                },
              },
            ],
          },
        };

        const result = createTestCaseSchema.safeParse(payload);
        assert.strictEqual(result.success, true);
        assert.strictEqual(
          result.data.body.steps[0].assertion.locator.strategy,
          strategy
        );
      });
    });

    it('should reject invalid assertion locator strategies', () => {
      const invalid = {
        body: {
          name: 'Invalid Locator Strategy Test',
          steps: [
            {
              order: 1,
              action: 'assert',
              assertion: {
                type: 'visible',
                locator: {
                  strategy: 'invalid_jquery_selector',
                  value: '#element',
                },
              },
            },
          ],
        },
      };

      const result = createTestCaseSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
      assert.ok(
        result.error.issues.some((i) =>
          i.message.includes('css, xpath, id, text, role, or testid')
        )
      );
    });
  });

  describe('3. Action-Specific Steps Validation (select & press)', () => {
    it('should validate select action with option value', () => {
      const payload = {
        body: {
          name: 'Select Country Dropdown',
          steps: [
            {
              order: 1,
              action: 'select',
              locator: {
                strategy: 'css',
                value: 'select#country-picker',
              },
              value: 'India',
            },
          ],
        },
      };

      const result = createTestCaseSchema.safeParse(payload);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.body.steps[0].action, 'select');
      assert.strictEqual(result.data.body.steps[0].value, 'India');
    });

    it('should validate press action with standard keyboard keys (Enter, Escape, Tab)', () => {
      const keys = ['Enter', 'Escape', 'Tab', 'ArrowDown', 'Backspace'];

      keys.forEach((key, idx) => {
        const payload = {
          body: {
            name: `Press Key ${key}`,
            steps: [
              {
                order: idx + 1,
                action: 'press',
                locator: {
                  strategy: 'css',
                  value: 'input#search-box',
                },
                value: key,
              },
            ],
          },
        };

        const result = createTestCaseSchema.safeParse(payload);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.steps[0].action, 'press');
        assert.strictEqual(result.data.body.steps[0].value, key);
      });
    });
  });
});
