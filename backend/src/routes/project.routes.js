import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import {
  createEnvironment,
  getEnvironmentsByProject,
} from '../controllers/environment.controller.js';
import {
  createSuite,
  getSuitesByProject,
} from '../controllers/suite.controller.js';
import {
  createTestCase,
  getTestCasesByProject,
} from '../controllers/test-case.controller.js';
import { getRunsByProject, getSuiteRunsByProject } from '../controllers/test-run.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/project.validator.js';
import { createEnvironmentSchema } from '../validators/environment.validator.js';
import { createSuiteSchema } from '../validators/suite.validator.js';
import { createTestCaseSchema } from '../validators/test-case.validator.js';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Project CRUD
router.post('/', validate(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.patch('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

// Nested routes: Environments
router.post(
  '/:projectId/environments',
  validate(createEnvironmentSchema),
  createEnvironment
);
router.get('/:projectId/environments', getEnvironmentsByProject);

// Nested routes: Test Suites
router.post('/:projectId/suites', validate(createSuiteSchema), createSuite);
router.get('/:projectId/suites', getSuitesByProject);

// Nested routes: Test Cases
router.post(
  '/:projectId/test-cases',
  validate(createTestCaseSchema),
  createTestCase
);
router.get('/:projectId/test-cases', getTestCasesByProject);

// Nested routes: Test Runs
router.get('/:projectId/test-runs', getRunsByProject);

// Nested routes: Suite Runs
router.get('/:projectId/suite-runs', getSuiteRunsByProject);

export default router;
