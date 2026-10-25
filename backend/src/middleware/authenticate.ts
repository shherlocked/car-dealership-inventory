import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies the Bearer JWT and attaches `{ id, role }` to `req.user`.
 * Responds 401 for a missing, malformed, invalid or expired token.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ error: { message: 'Authentication required' } });
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    res.status(401).json({ error: { message: 'Invalid or expired token' } });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const id = Number(decoded.sub);
    if (!Number.isInteger(id) || typeof decoded.role !== 'string') {
      res.status(401).json({ error: { message: 'Invalid or expired token' } });
      return;
    }

    req.user = { id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

export default authenticate;
