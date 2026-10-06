import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createProjectSchema, updateProjectSchema } from '../src/validators/project.validator.js';
import { createSuiteSchema } from '../src/validators/suite.validator.js';
import { createTestCaseSchema } from '../src/validators/test-case.validator.js';
import { createEnvironmentSchema } from '../src/validators/environment.validator.js';

describe('Phase 2 Request Validators Test Suite', () => {
  describe('Project Validation', () => {
    it('should validate a valid project payload', () => {
      const valid = {
        body: {
          name: 'E-Commerce QA',
          description: 'Automated test suite for web storefront',
          baseUrl: 'https://store.example.com',
        },
      };
      const result = createProjectSchema.safeParse(valid);
      assert.strictEqual(result.success, true);
    });

    it('should reject a project payload with a missing name', () => {
      const invalid = {
        body: {
          baseUrl: 'https://store.example.com',
        },
      };
      const result = createProjectSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.issues.some((i) => i.path.includes('name')));
    });

    it('should reject an empty baseUrl', () => {
      const invalid = {
        body: {
          name: 'Storefront',
          baseUrl: '',
        },
      };
      const result = createProjectSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });
  });

  describe('Environment Validation', () => {
    it('should validate an environment payload with variables', () => {
      const valid = {
        body: {
          name: 'Staging',
          baseUrl: 'https://staging.example.com',
          variables: [
            { key: 'API_KEY', value: 'secret-token-123', isSecret: true },
            { key: 'TIMEOUT', value: '5000', isSecret: false },
          ],
          isDefault: true,
        },
      };
      const result = createEnvironmentSchema.safeParse(valid);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Test Suite Validation', () => {
    it('should validate a test suite with tags', () => {
      const valid = {
        body: {
          name: 'Authentication Flow',
          description: 'Login, logout, and password recovery',
          tags: ['auth', 'critical', 'smoke'],
        },
      };
      const result = createSuiteSchema.safeParse(valid);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Test Case & Locator Validation', () => {
    it('should validate a test case with structured steps, locators, and assertions', () => {
      const valid = {
        body: {
          name: 'User Login with Valid Credentials',
          description: 'Verifies that users can log into their dashboard',
          priority: 'high',
          status: 'active',
          tags: ['smoke', 'login'],
          steps: [
            {
              order: 1,
              action: 'navigate',
              value: '/login',
            },
            {
              order: 2,
              action: 'fill',
              locator: {
                strategy: 'css',
                value: '#email',
                elementText: 'Email Address',
              },
              value: 'user@example.com',
            },
            {
              order: 3,
              action: 'fill',
              locator: {
                strategy: 'xpath',
                value: '//input[@type="password"]',
              },
              value: 'SecretPass123',
            },
            {
              order: 4,
              action: 'click',
              locator: {
                strategy: 'testid',
                value: 'login-submit-btn',
              },
            },
            {
              order: 5,
              action: 'assert',
              assertion: {
                type: 'visible',
                locator: {
                  strategy: 'id',
                  value: 'user-profile-badge',
                },
              },
            },
          ],
        },
      };
      const result = createTestCaseSchema.safeParse(valid);
      assert.strictEqual(result.success, true);
    });

    it('should reject invalid locator strategy', () => {
      const invalid = {
        body: {
          name: 'Invalid Locator Test',
          steps: [
            {
              order: 1,
              action: 'click',
              locator: {
                strategy: 'invalid_strategy',
                value: '#btn',
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

    it('should reject invalid action type', () => {
      const invalid = {
        body: {
          name: 'Invalid Action Test',
          steps: [
            {
              order: 1,
              action: 'dance',
            },
          ],
        },
      };
      const result = createTestCaseSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });
  });
});
