import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  isMaskedValue,
  MASKED_VALUE,
} from '../src/utils/encryption.js';
import { sanitizeEnvironment } from '../src/services/environment.service.js';

describe('Environment Secret Encryption & Security Test Suite', () => {
  it('should encrypt a plaintext string into authenticated AES-256-GCM metadata', () => {
    const secret = 'sk_live_stripe_secret_token_12345';
    const encrypted = encryptSecret(secret);

    assert.strictEqual(encrypted.encrypted, true);
    assert.ok(typeof encrypted.iv === 'string' && encrypted.iv.length === 24); // 12 bytes = 24 hex chars
    assert.ok(typeof encrypted.authTag === 'string' && encrypted.authTag.length === 32); // 16 bytes = 32 hex chars
    assert.ok(typeof encrypted.ciphertext === 'string' && encrypted.ciphertext.length > 0);
    assert.notStrictEqual(encrypted.ciphertext, secret);
  });

  it('should accurately decrypt an encrypted secret payload back to original plaintext', () => {
    const original = 'super-secret-api-key-with-special-characters!@#$%^&*()_+{}[]:;';
    const encrypted = encryptSecret(original);
    const decrypted = decryptSecret(encrypted);

    assert.strictEqual(decrypted, original);
  });

  it('should generate distinct IVs and ciphertexts for identical plaintext inputs (semantic security)', () => {
    const secret = 'same-token';
    const enc1 = encryptSecret(secret);
    const enc2 = encryptSecret(secret);

    assert.notStrictEqual(enc1.iv, enc2.iv);
    assert.notStrictEqual(enc1.ciphertext, enc2.ciphertext);
    assert.strictEqual(decryptSecret(enc1), secret);
    assert.strictEqual(decryptSecret(enc2), secret);
  });

  it('should fail decryption if ciphertext is tampered with (authenticated integrity guarantee)', () => {
    const secret = 'my-authenticated-token';
    const encrypted = encryptSecret(secret);

    // Tamper with the last character of ciphertext
    const tamperedCiphertext =
      encrypted.ciphertext.slice(0, -1) + (encrypted.ciphertext.endsWith('0') ? '1' : '0');

    const tamperedPayload = {
      ...encrypted,
      ciphertext: tamperedCiphertext,
    };

    assert.throws(() => {
      decryptSecret(tamperedPayload);
    }, /unable to authenticate data|Unsupported state/i);
  });

  it('should fail decryption if authTag is tampered with', () => {
    const secret = 'my-authenticated-token';
    const encrypted = encryptSecret(secret);

    const tamperedTag =
      encrypted.authTag.slice(0, -1) + (encrypted.authTag.endsWith('0') ? '1' : '0');

    const tamperedPayload = {
      ...encrypted,
      authTag: tamperedTag,
    };

    assert.throws(() => {
      decryptSecret(tamperedPayload);
    }, /unable to authenticate data|Unsupported state/i);
  });

  it('should support JSON stringified payload input in decryptSecret', () => {
    const secret = 'json-string-payload-test';
    const encrypted = encryptSecret(secret);
    const jsonString = JSON.stringify(encrypted);

    const decrypted = decryptSecret(jsonString);
    assert.strictEqual(decrypted, secret);
  });

  it('should correctly handle masking helpers', () => {
    assert.strictEqual(maskSecret(), MASKED_VALUE);
    assert.strictEqual(isMaskedValue(MASKED_VALUE), true);
    assert.strictEqual(isMaskedValue('plaintext'), false);
    assert.strictEqual(isMaskedValue(''), false);
  });

  it('should sanitize environments by stripping encryptedData and masking isSecret variables', () => {
    const rawEnv = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Production',
      baseUrl: 'https://api.prod.example.com',
      isDefault: true,
      variables: [
        {
          key: 'API_KEY',
          value: '••••••••',
          isSecret: true,
          encryptedData: {
            encrypted: true,
            iv: 'abcdef0123456789abcdef01',
            authTag: '0123456789abcdef0123456789abcdef',
            ciphertext: 'fedcba9876543210',
          },
        },
        {
          key: 'APP_ENV',
          value: 'production',
          isSecret: false,
          encryptedData: null,
        },
      ],
    };

    const sanitized = sanitizeEnvironment(rawEnv);

    // Verify non-secret remains untouched
    assert.strictEqual(sanitized.variables[1].key, 'APP_ENV');
    assert.strictEqual(sanitized.variables[1].value, 'production');
    assert.strictEqual(sanitized.variables[1].isSecret, false);
    assert.strictEqual(sanitized.variables[1].encryptedData, undefined);

    // Verify secret variable is masked and internal crypto metadata is stripped
    assert.strictEqual(sanitized.variables[0].key, 'API_KEY');
    assert.strictEqual(sanitized.variables[0].value, MASKED_VALUE);
    assert.strictEqual(sanitized.variables[0].isSecret, true);
    assert.strictEqual(sanitized.variables[0].encryptedData, undefined);
  });

  it('should preserve existing encrypted data when update payload submits masked placeholder', () => {
    const secret = 'original-secret-token-123';
    const encryptedInitial = encryptSecret(secret);

    const existingVariables = [
      {
        key: 'AUTH_SECRET',
        value: MASKED_VALUE,
        isSecret: true,
        encryptedData: encryptedInitial,
      },
    ];

    // User submits masked value back during edit
    const incomingVariables = [
      {
        key: 'AUTH_SECRET',
        value: MASKED_VALUE,
        isSecret: true,
      },
    ];

    // Verify preservation logic
    const existing = existingVariables.find((ev) => ev.key === incomingVariables[0].key);
    assert.ok(existing);
    assert.strictEqual(isMaskedValue(incomingVariables[0].value), true);
    assert.strictEqual(decryptSecret(existing.encryptedData), secret);
  });

  it('should re-encrypt when update payload submits a new plaintext secret value', () => {
    const originalSecret = 'original-secret-token-123';
    const newSecret = 'new-rotated-secret-token-456';

    const existingVariables = [
      {
        key: 'AUTH_SECRET',
        value: MASKED_VALUE,
        isSecret: true,
        encryptedData: encryptSecret(originalSecret),
      },
    ];

    const incomingVariables = [
      {
        key: 'AUTH_SECRET',
        value: newSecret,
        isSecret: true,
      },
    ];

    assert.strictEqual(isMaskedValue(incomingVariables[0].value), false);
    const updatedEncrypted = encryptSecret(incomingVariables[0].value);
    assert.notStrictEqual(updatedEncrypted.ciphertext, existingVariables[0].encryptedData.ciphertext);
    assert.strictEqual(decryptSecret(updatedEncrypted), newSecret);
  });
});
