import { Router } from 'express';
import {
  getSuiteById,
  updateSuite,
  deleteSuite,
} from '../controllers/suite.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateSuiteSchema } from '../validators/suite.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getSuiteById);
router.patch('/:id', validate(updateSuiteSchema), updateSuite);
router.delete('/:id', deleteSuite);

export default router;
