import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler } from './middleware/errorHandler';

/**
 * Builds and returns the configured Express application.
 * Kept separate from server startup so tests can import it directly.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
