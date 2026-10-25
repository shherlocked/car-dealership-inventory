import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/authRoutes';
import { createVehicleRouter } from './routes/vehicleRoutes';

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

  app.use('/api/auth', createAuthRouter());
  app.use('/api/vehicles', createVehicleRouter());

  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
