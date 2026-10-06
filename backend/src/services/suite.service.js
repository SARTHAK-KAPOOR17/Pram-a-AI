import { TestSuite } from '../models/suite.model.js';
import { TestCase } from '../models/test-case.model.js';
import { assertProjectAccess } from './project.service.js';
import { AppError } from '../utils/api-error.js';

export const createSuite = async (projectId, userId, data) => {
  await assertProjectAccess(projectId, userId);

  const suite = await TestSuite.create({
    ...data,
    projectId,
    createdBy: userId,
  });

  return suite;
};

export const getSuitesByProject = async (projectId, userId) => {
  await assertProjectAccess(projectId, userId);

  const suites = await TestSuite.find({ projectId }).sort({ createdAt: -1 });

  // Enrich with test count
  const enriched = await Promise.all(
    suites.map(async (s) => {
      const testCount = await TestCase.countDocuments({ suiteId: s._id });
      return {
        ...s.toObject(),
        testCount,
      };
    })
  );

  return enriched;
};

export const getSuiteById = async (suiteId, userId) => {
  const suite = await TestSuite.findById(suiteId);
  if (!suite) {
    throw AppError.notFound('Test suite not found');
  }
  await assertProjectAccess(suite.projectId, userId);

  const testCount = await TestCase.countDocuments({ suiteId });
  return {
    ...suite.toObject(),
    testCount,
  };
};

export const updateSuite = async (suiteId, userId, updateData) => {
  const suite = await TestSuite.findById(suiteId);
  if (!suite) {
    throw AppError.notFound('Test suite not found');
  }
  await assertProjectAccess(suite.projectId, userId);

  const updated = await TestSuite.findByIdAndUpdate(
    suiteId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updated;
};

export const deleteSuite = async (suiteId, userId) => {
  const suite = await TestSuite.findById(suiteId);
  if (!suite) {
    throw AppError.notFound('Test suite not found');
  }
  await assertProjectAccess(suite.projectId, userId);

  // Detach or unset suiteId on associated test cases
  await TestCase.updateMany({ suiteId }, { $set: { suiteId: null } });

  await TestSuite.findByIdAndDelete(suiteId);
  return { message: 'Test suite deleted successfully' };
};
