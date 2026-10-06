import { Router } from 'express';
import {
  getEnvironmentById,
  updateEnvironment,
  deleteEnvironment,
} from '../controllers/environment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateEnvironmentSchema } from '../validators/environment.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getEnvironmentById);
router.patch('/:id', validate(updateEnvironmentSchema), updateEnvironment);
router.delete('/:id', deleteEnvironment);

export default router;
