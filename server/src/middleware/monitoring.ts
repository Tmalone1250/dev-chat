import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

// Track response times
const responseTime = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - start;
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
      });
    });

    next();
  };
};

// Track memory usage
const memoryUsage = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const used = process.memoryUsage();
    logger.debug('Memory usage', {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`,
    });
    next();
  };
};

// Track active connections
let activeConnections = 0;

const connectionCounter = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    activeConnections++;
    logger.debug(`Active connections: ${activeConnections}`);

    res.on('finish', () => {
      activeConnections--;
      logger.debug(`Active connections: ${activeConnections}`);
    });

    next();
  };
};

// Error monitoring
const errorMonitoring = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Application error', {
    error: {
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
    },
  });

  next(error);
};

// Health check endpoint
const healthCheck = (req: Request, res: Response) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
  };
  
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error instanceof Error ? error.message : 'Error';
    res.status(503).send(healthcheck);
  }
};

export {
  responseTime,
  memoryUsage,
  connectionCounter,
  errorMonitoring,
  healthCheck,
};
