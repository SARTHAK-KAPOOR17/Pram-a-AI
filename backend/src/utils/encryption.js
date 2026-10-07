import crypto from 'node:crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128 bits authentication tag
export const MASKED_VALUE = '••••••••';

/**
 * Derives a deterministic 32-byte cryptographic key from the configured ENCRYPTION_KEY.
 * Never hardcodes or accepts user-controlled keys.
 *
 * @returns {Buffer} 32-byte Buffer key suitable for AES-256
 */
const getKey = () => {
  const rawKey = config.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is not defined in environment configuration');
  }
  return crypto.createHash('sha256').update(rawKey).digest();
};

/**
 * Encrypts a plaintext secret string using AES-256-GCM.
 *
 * @param {string} value - The plaintext string to encrypt.
 * @returns {{ encrypted: boolean, iv: string, authTag: string, ciphertext: string }|null}
 */
export const encryptSecret = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = String(value);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(stringValue, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted: true,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  };
};

/**
 * Decrypts an encrypted payload using AES-256-GCM.
 *
 * @param {object|string} encryptedPayload - Object containing { iv, authTag, ciphertext } or JSON string.
 * @returns {string} Plaintext decrypted value.
 */
export const decryptSecret = (encryptedPayload) => {
  if (!encryptedPayload) {
    return '';
  }

  let payload = encryptedPayload;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      throw new Error('Invalid encrypted payload format: expected JSON object');
    }
  }

  const { iv, authTag, ciphertext } = payload;
  if (!iv || !authTag || !ciphertext) {
    throw new Error(
      'Encrypted payload missing required metadata (iv, authTag, ciphertext)'
    );
  }

  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex'),
    { authTagLength: AUTH_TAG_LENGTH }
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

/**
 * Returns the standard masked representation for secret variables.
 * @returns {string}
 */
export const maskSecret = () => MASKED_VALUE;

/**
 * Checks whether a variable value equals the masked placeholder.
 * @param {string} val
 * @returns {boolean}
 */
export const isMaskedValue = (val) => val === MASKED_VALUE;
