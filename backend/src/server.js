import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    // Attempt database connection (gracefully continues if Mongo is not running locally)
    await connectDatabase();

    server = app.listen(config.PORT, () => {
      logger.info(`Pramāṇa AI Server running on port ${config.PORT} [${config.NODE_ENV}]`);
      logger.info(`Health check endpoint: http://localhost:${config.PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      logger.info('Process termination complete.');
      process.exit(0);
    });

    // Force close after 10 seconds if hanging
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message);
  process.exit(1);
});

startServer();
