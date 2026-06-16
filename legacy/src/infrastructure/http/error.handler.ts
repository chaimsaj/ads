import type { Request, Response, NextFunction } from 'express';
import type { ZodError } from 'zod';

import { createLogger } from '../logging/logger';
import { AppError, ValidationError } from '../errors';

const logger = createLogger('error-handler');

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof ValidationError) {
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.details,
      requestId,
    });
    return;
  }

  if (isZodError(err)) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
      requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', {
        error: err.message,
        stack: err.stack,
        requestId,
        path: req.path,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      error: err.isOperational ? err.message : 'Internal server error',
      code: err.code,
      requestId,
    });
    return;
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId,
  });
}

function isZodError(err: Error): err is ZodError {
  return err.name === 'ZodError';
}
