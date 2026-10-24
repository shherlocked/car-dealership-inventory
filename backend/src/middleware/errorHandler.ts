import type { NextFunction, Request, Response } from 'express';

/**
 * Central error-handling middleware.
 * Must be registered last, after all routes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  const status = 500;

  res.status(status).json({
    error: {
      message,
      status,
    },
  });
}

export default errorHandler;
