import morgan from 'morgan';

// Stream custom output format
export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    skip: (req) => process.env.NODE_ENV === 'test' && req.url === '/api/health',
  }
);
