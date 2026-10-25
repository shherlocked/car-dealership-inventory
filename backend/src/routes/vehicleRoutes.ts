import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { VehicleRepository } from '../repositories/vehicleRepository';
import { VehicleService } from '../services/vehicleService';

const ADMIN = 'ADMIN';

/**
 * Builds the vehicle router with its dependency graph wired up.
 * Every route requires authentication; mutations require the ADMIN role.
 */
export function createVehicleRouter(): Router {
  const router = Router();
  const controller = new VehicleController(new VehicleService(new VehicleRepository()));

  router.use(authenticate);

  // Registered before /:id so the literal path is not shadowed.
  router.get('/search', controller.search);

  router.get('/', controller.list);
  router.post('/', requireRole(ADMIN), controller.create);
  router.put('/:id', requireRole(ADMIN), controller.update);
  router.delete('/:id', requireRole(ADMIN), controller.remove);
  router.post('/:id/purchase', controller.purchase);
  router.post('/:id/restock', requireRole(ADMIN), controller.restock);

  return router;
}

export default createVehicleRouter;
