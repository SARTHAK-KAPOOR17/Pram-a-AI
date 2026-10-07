import * as executionService from '../services/execution.service.js';
import { ApiResponse } from '../utils/api-response.js';

export const executeTestRun = async (req, res, next) => {
  try {
    const testRun = await executionService.executeTestCase(req.user._id, req.body);
    return ApiResponse.created(res, testRun, 'Test execution completed successfully');
  } catch (error) {
    next(error);
  }
};

export const getTestRunById = async (req, res, next) => {
  try {
    const testRun = await executionService.getTestRunById(req.params.id, req.user._id);
    return ApiResponse.success(res, testRun, 'Test run details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getRunsByTestCase = async (req, res, next) => {
  try {
    const runs = await executionService.getRunsByTestCase(req.params.testCaseId, req.user._id);
    return ApiResponse.success(res, runs, 'Test case run history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getRunsByProject = async (req, res, next) => {
  try {
    const runs = await executionService.getRunsByProject(req.params.projectId, req.user._id);
    return ApiResponse.success(res, runs, 'Project run history retrieved successfully');
  } catch (error) {
    next(error);
  }
};
