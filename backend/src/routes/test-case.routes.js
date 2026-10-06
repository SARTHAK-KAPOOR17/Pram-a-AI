import { Router } from 'express';
import {
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
} from '../controllers/test-case.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateTestCaseSchema } from '../validators/test-case.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getTestCaseById);
router.patch('/:id', validate(updateTestCaseSchema), updateTestCase);
router.delete('/:id', deleteTestCase);

export default router;
