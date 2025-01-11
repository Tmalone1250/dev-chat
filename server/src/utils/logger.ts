import winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      '@timestamp': timestamp,
      level,
      message,
      ...meta,
    });
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Rotating file transport for production
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // Error log file
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
  ],
});

// Create a stream object for Morgan middleware
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };

// Log unhandled rejections and exceptions
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Give the logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
