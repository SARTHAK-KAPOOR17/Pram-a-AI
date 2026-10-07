import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import environmentRoutes from './environment.routes.js';
import suiteRoutes from './suite.routes.js';
import testCaseRoutes from './test-case.routes.js';
import testRunRoutes from './test-run.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/environments', environmentRoutes);
router.use('/suites', suiteRoutes);
router.use('/test-cases', testCaseRoutes);
router.use('/test-runs', testRunRoutes);

export default router;
