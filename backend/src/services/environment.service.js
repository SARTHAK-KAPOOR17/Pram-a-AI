import { Environment } from '../models/environment.model.js';
import { assertProjectAccess } from './project.service.js';
import { AppError } from '../utils/api-error.js';

export const createEnvironment = async (projectId, userId, data) => {
  await assertProjectAccess(projectId, userId);

  // If this environment is set as default, unset other defaults in the project
  if (data.isDefault) {
    await Environment.updateMany({ projectId }, { isDefault: false });
  }

  const environment = await Environment.create({
    ...data,
    projectId,
  });

  return environment;
};

export const getEnvironmentsByProject = async (projectId, userId) => {
  await assertProjectAccess(projectId, userId);
  return Environment.find({ projectId }).sort({ isDefault: -1, createdAt: 1 });
};

export const getEnvironmentById = async (envId, userId) => {
  const env = await Environment.findById(envId);
  if (!env) {
    throw AppError.notFound('Environment not found');
  }
  await assertProjectAccess(env.projectId, userId);
  return env;
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

  const updated = await Environment.findByIdAndUpdate(
    envId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updated;
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
