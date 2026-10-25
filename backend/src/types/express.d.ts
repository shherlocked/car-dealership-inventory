import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user, populated by the authenticate middleware. */
      user?: {
        id: number;
        role: string;
      };
    }
  }
}

export {};
