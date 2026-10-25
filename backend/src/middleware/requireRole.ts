import type { NextFunction, Request, Response } from 'express';

/**
 * Builds middleware that allows the request only when `req.user.role` matches.
 * Responds 401 when unauthenticated and 403 when the role is insufficient.
 *
 * @param role Role required to proceed.
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Authentication required' } });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }

    next();
  };
}

export default requireRole;
