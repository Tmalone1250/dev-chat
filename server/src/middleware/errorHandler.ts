import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(400, message);
};

const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(400, message);
};

const handleJWTError = () => {
  return new AppError(401, 'Invalid token. Please log in again.');
};

const handleJWTExpiredError = () => {
  return new AppError(401, 'Your token has expired. Please log in again.');
};

const sendErrorDev = (err: AppError, res: Response) => {
  logger.error('ERROR 💥', {
    status: err.statusCode,
    error: err,
    message: err.message,
    stack: err.stack,
  });

  res.status(err.statusCode).json({
    status: 'error',
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.error('Operational Error:', {
      status: err.statusCode,
      message: err.message,
    });

    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    logger.error('Programming Error:', {
      error: err,
      message: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
