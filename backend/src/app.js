import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { requestLogger } from './middleware/request-logger.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import path from 'node:path';
import apiRoutes from './routes/index.js';

const app = express();

// Security Headers (configured to allow cross-origin asset loading for screenshots)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman) or matching frontend
      if (!origin || origin === config.CLIENT_URL || config.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static execution artifacts (screenshots, traces)
app.use('/artifacts', express.static(path.resolve(process.cwd(), 'artifacts')));

// Request Logging
app.use(requestLogger);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Pramāṇa AI Backend API',
    tagline: 'Intelligent Verification. Self-Healing Tests.',
    status: 'online',
    version: '0.1.0',
    documentation: '/docs',
    healthCheck: '/api/health',
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
