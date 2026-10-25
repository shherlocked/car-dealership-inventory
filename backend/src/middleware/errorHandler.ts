import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

const GENERIC_MESSAGE = 'Internal Server Error';

/** Builds a Zod error message from the first issue, prefixed by its field path. */
function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return 'Invalid request payload';
  }
  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

/**
 * Central error-handling middleware.
 * Every response is JSON shaped as `{ error: { message } }`.
 * Must be registered last, after all routes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: { message: formatZodError(err) } });
    return;
  }

  res.status(500).json({ error: { message: GENERIC_MESSAGE } });
}

export default errorHandler;
