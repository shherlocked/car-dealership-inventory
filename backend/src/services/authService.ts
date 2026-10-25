import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRepository } from '../repositories/userRepository';
import { AppError } from '../utils/AppError';

const BCRYPT_ROUNDS = 10;
const DEFAULT_ROLE = 'USER';
const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';

/** Public user shape returned to clients (never includes the password hash). */
export interface PublicUser {
  id: number;
  email: string;
  role: string;
}

/** Result of a successful login. */
export interface LoginResult {
  token: string;
  user: PublicUser;
}

/**
 * Authentication business logic: registration and login.
 * Dependencies are injected to keep the service testable and decoupled.
 */
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Registers a new user with the USER role and a hashed password.
   *
   * @param email Unique email address.
   * @param password Plaintext password to hash.
   * @returns The created user's public fields.
   * @throws {AppError} 409 when the email is already registered.
   */
  async register(email: string, password: string): Promise<PublicUser> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userRepository.create({
      email,
      passwordHash,
      role: DEFAULT_ROLE,
    });

    return this.toPublicUser(user);
  }

  /**
   * Authenticates a user and issues a signed JWT.
   *
   * @param email Email address.
   * @param password Plaintext password to verify.
   * @returns A signed token and the user's public fields.
   * @throws {AppError} 401 for an unknown email or a wrong password.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
    }

    return { token: this.signToken(user), user: this.toPublicUser(user) };
  }

  /**
   * Signs a JWT for the user. Env vars are read at call time so tests can set them.
   */
  private signToken(user: { id: number; role: string }): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError(500, 'Authentication is not configured');
    }

    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as SignOptions['expiresIn'],
    };

    return jwt.sign({ sub: String(user.id), role: user.role }, secret, options);
  }

  /** Strips sensitive fields from a user record. */
  private toPublicUser(user: { id: number; email: string; role: string }): PublicUser {
    return { id: user.id, email: user.email, role: user.role };
  }
}

export default AuthService;
