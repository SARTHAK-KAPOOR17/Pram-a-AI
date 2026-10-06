import * as testCaseService from '../services/test-case.service.js';
import { ApiResponse } from '../utils/api-response.js';

export const createTestCase = async (req, res, next) => {
  try {
    const testCase = await testCaseService.createTestCase(
      req.params.projectId,
      req.user._id,
      req.body
    );
    return ApiResponse.created(res, testCase, 'Test case created successfully');
  } catch (error) {
    next(error);
  }
};

export const getTestCasesByProject = async (req, res, next) => {
  try {
    const tests = await testCaseService.getTestCasesByProject(
      req.params.projectId,
      req.user._id,
      req.query
    );
    return ApiResponse.success(res, tests, 'Test cases retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getTestCaseById = async (req, res, next) => {
  try {
    const testCase = await testCaseService.getTestCaseById(req.params.id, req.user._id);
    return ApiResponse.success(res, testCase, 'Test case retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateTestCase = async (req, res, next) => {
  try {
    const updated = await testCaseService.updateTestCase(
      req.params.id,
      req.user._id,
      req.body
    );
    return ApiResponse.success(res, updated, 'Test case updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTestCase = async (req, res, next) => {
  try {
    const result = await testCaseService.deleteTestCase(req.params.id, req.user._id);
    return ApiResponse.success(res, result, 'Test case deleted successfully');
  } catch (error) {
    next(error);
  }
};
