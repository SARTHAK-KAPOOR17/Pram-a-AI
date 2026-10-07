import { Router } from 'express';
import { getSuiteRunById } from '../controllers/test-run.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getSuiteRunById);

export default router;
