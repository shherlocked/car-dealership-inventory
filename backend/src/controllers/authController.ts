import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from '../services/authService';
import { loginSchema, registerSchema } from '../utils/validation';

/**
 * Thin HTTP layer for authentication.
 * Parses input, delegates to the service and shapes the response.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles POST /api/auth/register.
   * Responds 201 with the created user's public fields.
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = registerSchema.parse(req.body);
      const user = await this.authService.register(email, password);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/auth/login.
   * Responds 200 with a token and the user's public fields.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
