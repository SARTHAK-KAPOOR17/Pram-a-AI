/**
 * Structured console logger for Pramāṇa AI backend.
 */
const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [Pramāṇa-Backend]`;
  const metaStr = meta ? ` ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
  return `${prefix} ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta) => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage('error', message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};
