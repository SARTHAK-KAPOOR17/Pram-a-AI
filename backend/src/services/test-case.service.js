import { TestCase } from '../models/test-case.model.js';
import { TestSuite } from '../models/suite.model.js';
import { assertProjectAccess } from './project.service.js';
import { AppError } from '../utils/api-error.js';

export const createTestCase = async (projectId, userId, data) => {
  await assertProjectAccess(projectId, userId);

  // Validate suite belongs to this project if provided
  if (data.suiteId) {
    const suite = await TestSuite.findOne({ _id: data.suiteId, projectId });
    if (!suite) {
      throw AppError.badRequest('Specified test suite does not exist in this project');
    }
  }

  // Ensure steps have contiguous sequential orders
  const steps = (data.steps || []).map((step, idx) => ({
    ...step,
    order: step.order || idx + 1,
  }));

  const testCase = await TestCase.create({
    ...data,
    steps,
    projectId,
    createdBy: userId,
  });

  return testCase;
};

export const getTestCasesByProject = async (projectId, userId, filters = {}) => {
  await assertProjectAccess(projectId, userId);

  const query = { projectId };
  if (filters.suiteId) {
    query.suiteId = filters.suiteId === 'unassigned' ? null : filters.suiteId;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.priority) {
    query.priority = filters.priority;
  }
  if (filters.search) {
    query.name = { $regex: filters.search, $options: 'i' };
  }

  const tests = await TestCase.find(query)
    .populate('suiteId', 'name')
    .sort({ updatedAt: -1 });

  return tests;
};

export const getTestCaseById = async (testCaseId, userId) => {
  const testCase = await TestCase.findById(testCaseId).populate('suiteId', 'name');
  if (!testCase) {
    throw AppError.notFound('Test case not found');
  }
  await assertProjectAccess(testCase.projectId, userId);
  return testCase;
};

export const updateTestCase = async (testCaseId, userId, updateData) => {
  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) {
    throw AppError.notFound('Test case not found');
  }
  await assertProjectAccess(testCase.projectId, userId);

  if (updateData.suiteId) {
    const suite = await TestSuite.findOne({
      _id: updateData.suiteId,
      projectId: testCase.projectId,
    });
    if (!suite) {
      throw AppError.badRequest('Specified test suite does not exist in this project');
    }
  }

  if (updateData.steps) {
    updateData.steps = updateData.steps.map((step, idx) => ({
      ...step,
      order: step.order || idx + 1,
    }));
  }

  const updated = await TestCase.findByIdAndUpdate(
    testCaseId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('suiteId', 'name');

  return updated;
};

export const deleteTestCase = async (testCaseId, userId) => {
  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) {
    throw AppError.notFound('Test case not found');
  }
  await assertProjectAccess(testCase.projectId, userId);

  await TestCase.findByIdAndDelete(testCaseId);
  return { message: 'Test case deleted successfully' };
};
