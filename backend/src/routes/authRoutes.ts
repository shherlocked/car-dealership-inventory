import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { UserRepository } from '../repositories/userRepository';
import { AuthService } from '../services/authService';

/**
 * Builds the authentication router with its dependency graph wired up.
 */
export function createAuthRouter(): Router {
  const router = Router();
  const controller = new AuthController(new AuthService(new UserRepository()));

  router.post('/register', controller.register);
  router.post('/login', controller.login);

  return router;
}

export default createAuthRouter;
