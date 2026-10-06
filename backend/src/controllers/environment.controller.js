import * as envService from '../services/environment.service.js';
import { ApiResponse } from '../utils/api-response.js';

export const createEnvironment = async (req, res, next) => {
  try {
    const environment = await envService.createEnvironment(
      req.params.projectId,
      req.user._id,
      req.body
    );
    return ApiResponse.created(res, environment, 'Environment created successfully');
  } catch (error) {
    next(error);
  }
};

export const getEnvironmentsByProject = async (req, res, next) => {
  try {
    const environments = await envService.getEnvironmentsByProject(
      req.params.projectId,
      req.user._id
    );
    return ApiResponse.success(res, environments, 'Environments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getEnvironmentById = async (req, res, next) => {
  try {
    const environment = await envService.getEnvironmentById(req.params.id, req.user._id);
    return ApiResponse.success(res, environment, 'Environment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateEnvironment = async (req, res, next) => {
  try {
    const updated = await envService.updateEnvironment(
      req.params.id,
      req.user._id,
      req.body
    );
    return ApiResponse.success(res, updated, 'Environment updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteEnvironment = async (req, res, next) => {
  try {
    const result = await envService.deleteEnvironment(req.params.id, req.user._id);
    return ApiResponse.success(res, result, 'Environment deleted successfully');
  } catch (error) {
    next(error);
  }
};
