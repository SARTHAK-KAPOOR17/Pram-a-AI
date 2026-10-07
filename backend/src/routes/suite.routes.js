import { Router } from 'express';
import {
  getSuiteById,
  updateSuite,
  deleteSuite,
} from '../controllers/suite.controller.js';
import {
  executeSuiteRun,
  getRunsBySuite,
} from '../controllers/test-run.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateSuiteSchema } from '../validators/suite.validator.js';
import { createSuiteRunSchema } from '../validators/test-run.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getSuiteById);
router.patch('/:id', validate(updateSuiteSchema), updateSuite);
router.delete('/:id', deleteSuite);

// Nested routes: Suite executions
router.post('/:suiteId/runs', validate(createSuiteRunSchema), executeSuiteRun);
router.get('/:suiteId/runs', getRunsBySuite);

export default router;
