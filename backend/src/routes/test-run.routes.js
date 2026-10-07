import { Router } from 'express';
import { executeTestRun, getTestRunById } from '../controllers/test-run.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTestRunSchema } from '../validators/test-run.validator.js';

const router = Router();

// All TestRun endpoints require authentication
router.use(authenticate);

router.post('/', validate(createTestRunSchema), executeTestRun);
router.get('/:id', getTestRunById);

export default router;
