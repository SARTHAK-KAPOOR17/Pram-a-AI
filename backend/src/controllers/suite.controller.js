import * as suiteService from '../services/suite.service.js';
import { ApiResponse } from '../utils/api-response.js';

export const createSuite = async (req, res, next) => {
  try {
    const suite = await suiteService.createSuite(
      req.params.projectId,
      req.user._id,
      req.body
    );
    return ApiResponse.created(res, suite, 'Test suite created successfully');
  } catch (error) {
    next(error);
  }
};

export const getSuitesByProject = async (req, res, next) => {
  try {
    const suites = await suiteService.getSuitesByProject(
      req.params.projectId,
      req.user._id
    );
    return ApiResponse.success(res, suites, 'Test suites retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getSuiteById = async (req, res, next) => {
  try {
    const suite = await suiteService.getSuiteById(req.params.id, req.user._id);
    return ApiResponse.success(res, suite, 'Test suite retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSuite = async (req, res, next) => {
  try {
    const updated = await suiteService.updateSuite(
      req.params.id,
      req.user._id,
      req.body
    );
    return ApiResponse.success(res, updated, 'Test suite updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteSuite = async (req, res, next) => {
  try {
    const result = await suiteService.deleteSuite(req.params.id, req.user._id);
    return ApiResponse.success(res, result, 'Test suite deleted successfully');
  } catch (error) {
    next(error);
  }
};
