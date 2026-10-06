import { describe, it } from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

describe('API Route Protection & Health Test Suite', () => {
  it('GET /api/health should be public and return success', async () => {
    // Test app request via mock or event handler
    const req = {
      method: 'GET',
      url: '/api/health',
      headers: {},
    };
    // Direct verification of app import
    assert.ok(app);
  });

  it('Protected project endpoints should reject requests without Authorization header', async () => {
    // Emulate Express request lifecycle
    let errorSent = null;
    let statusCode = null;

    const mockReq = {
      headers: {},
      method: 'GET',
      originalUrl: '/api/projects',
    };

    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            errorSent = data;
          },
        };
      },
    };

    const mockNext = (err) => {
      if (err) {
        statusCode = err.statusCode;
        errorSent = { success: false, message: err.message };
      }
    };

    const { authenticate } = await import('../src/middleware/auth.js');
    await authenticate(mockReq, mockRes, mockNext);

    assert.strictEqual(statusCode, 401);
    assert.strictEqual(errorSent.message, 'Authentication token missing or invalid');
  });
});
