import { Environment } from '../models/environment.model.js';
import { assertProjectAccess } from './project.service.js';
import { AppError } from '../utils/api-error.js';
import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  isMaskedValue,
} from '../utils/encryption.js';

/**
 * Strips internal encrypted data and guarantees secrets are masked in API responses.
 */
export const sanitizeEnvironment = (envDoc) => {
  if (!envDoc) return null;
  const env = envDoc.toObject ? envDoc.toObject() : JSON.parse(JSON.stringify(envDoc));
  if (Array.isArray(env.variables)) {
    env.variables = env.variables.map((v) => ({
      key: v.key,
      value: v.isSecret ? maskSecret() : (v.value || ''),
      isSecret: Boolean(v.isSecret),
    }));
  }
  return env;
};

/**
 * Prepares variables for storage on environment creation.
 */
const processVariablesForCreate = (variables = []) => {
  return variables.map((v) => {
    if (v.isSecret) {
      const plaintext = v.value || '';
      return {
        key: v.key,
        value: maskSecret(),
        isSecret: true,
        encryptedData: encryptSecret(plaintext),
      };
    }
    return {
      key: v.key,
      value: v.value || '',
      isSecret: false,
      encryptedData: null,
    };
  });
};

/**
 * Prepares variables for storage on environment update, preserving existing ciphertext if masked.
 */
const processVariablesForUpdate = (incomingVariables = [], existingVariables = []) => {
  return incomingVariables.map((v) => {
    if (v.isSecret) {
      if (isMaskedValue(v.value)) {
        // Masked placeholder received: preserve previous encryptedData if available
        const existing = existingVariables.find((ev) => ev.key === v.key);
        if (existing && existing.encryptedData && existing.encryptedData.ciphertext) {
          return {
            key: v.key,
            value: maskSecret(),
            isSecret: true,
            encryptedData: existing.encryptedData,
          };
        }
        return {
          key: v.key,
          value: maskSecret(),
          isSecret: true,
          encryptedData: encryptSecret(''),
        };
      }
      // New secret value provided: encrypt it
      return {
        key: v.key,
        value: maskSecret(),
        isSecret: true,
        encryptedData: encryptSecret(v.value || ''),
      };
    }
    return {
      key: v.key,
      value: v.value || '',
      isSecret: false,
      encryptedData: null,
    };
  });
};

export const createEnvironment = async (projectId, userId, data) => {
  await assertProjectAccess(projectId, userId);

  // If this environment is set as default, unset other defaults in the project
  if (data.isDefault) {
    await Environment.updateMany({ projectId }, { isDefault: false });
  }

  const processedData = {
    ...data,
    projectId,
    variables: processVariablesForCreate(data.variables),
  };

  const environment = await Environment.create(processedData);
  return sanitizeEnvironment(environment);
};

export const getEnvironmentsByProject = async (projectId, userId) => {
  await assertProjectAccess(projectId, userId);
  const environments = await Environment.find({ projectId }).sort({ isDefault: -1, createdAt: 1 });
  return environments.map(sanitizeEnvironment);
};

export const getEnvironmentById = async (envId, userId) => {
  const env = await Environment.findById(envId);
  if (!env) {
    throw AppError.notFound('Environment not found');
  }
  await assertProjectAccess(env.projectId, userId);
  return sanitizeEnvironment(env);
};

export const updateEnvironment = async (envId, userId, updateData) => {
  const env = await Environment.findById(envId);
  if (!env) {
    throw AppError.notFound('Environment not found');
  }
  await assertProjectAccess(env.projectId, userId);

  if (updateData.isDefault) {
    await Environment.updateMany(
      { projectId: env.projectId, _id: { $ne: envId } },
      { isDefault: false }
    );
  }

  const payload = { ...updateData };
  if (updateData.variables) {
    payload.variables = processVariablesForUpdate(updateData.variables, env.variables || []);
  }

  const updated = await Environment.findByIdAndUpdate(
    envId,
    { $set: payload },
    { new: true, runValidators: true }
  );

  return sanitizeEnvironment(updated);
};

export const deleteEnvironment = async (envId, userId) => {
  const env = await Environment.findById(envId);
  if (!env) {
    throw AppError.notFound('Environment not found');
  }
  await assertProjectAccess(env.projectId, userId);

  const count = await Environment.countDocuments({ projectId: env.projectId });
  if (count <= 1) {
    throw AppError.badRequest('A project must have at least one environment');
  }

  await Environment.findByIdAndDelete(envId);
  return { message: 'Environment deleted successfully' };
};

/**
 * Internal method for test execution runner (Phase 3).
 * Securely retrieves and decrypts all environment variables for execution context.
 * NEVER expose this function via public CRUD controller routes.
 */
export const getDecryptedEnvironmentVariables = async (envId, userId) => {
  const env = await Environment.findById(envId);
  if (!env) {
    throw AppError.notFound('Environment not found');
  }
  await assertProjectAccess(env.projectId, userId);

  const resolved = {};
  for (const v of env.variables || []) {
    if (v.isSecret) {
      if (v.encryptedData && v.encryptedData.ciphertext) {
        resolved[v.key] = decryptSecret(v.encryptedData);
      } else {
        resolved[v.key] = '';
      }
    } else {
      resolved[v.key] = v.value || '';
    }
  }

  return {
    environmentId: env._id,
    name: env.name,
    baseUrl: env.baseUrl,
    variables: resolved,
  };
};
