import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../../src/config/prisma';

const DEFAULT_PASSWORD = 'Password123!';
const BCRYPT_ROUNDS = 10;

export interface CreatedUser {
  id: number;
  email: string;
  role: string;
  password: string;
}

/**
 * Inserts a user directly through Prisma, bypassing the auth service.
 * Useful for arranging authenticated scenarios in feature tests.
 *
 * @param role Role to assign to the user (defaults to "USER").
 * @param overrides Optional email/password overrides.
 * @returns The persisted user plus the plaintext password used.
 */
export async function createUser(
  role = 'USER',
  overrides: { email?: string; password?: string } = {},
): Promise<CreatedUser> {
  const email = overrides.email ?? `${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = overrides.password ?? DEFAULT_PASSWORD;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, role },
  });

  return { id: user.id, email: user.email, role: user.role, password };
}

/**
 * Creates a user with the given role and returns a signed JWT for it.
 * The token mirrors the payload the auth service is expected to produce.
 *
 * @param role Role to assign to the user (defaults to "USER").
 * @returns A signed JWT string.
 */
export async function getAuthToken(role = 'USER'): Promise<string> {
  const user = await createUser(role);

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as SignOptions['expiresIn'],
  };

  return jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_SECRET as string,
    options,
  );
}
