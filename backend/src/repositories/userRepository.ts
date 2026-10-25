import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';

/** Data required to persist a new user. */
export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: string;
}

/**
 * Data-access layer for users.
 * Encapsulates all Prisma queries so services stay persistence-agnostic.
 */
export class UserRepository {
  /**
   * Finds a user by their unique email address.
   *
   * @param email Email to look up.
   * @returns The matching user, or null when none exists.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Persists a new user.
   *
   * @param data Email, password hash and role for the new user.
   * @returns The created user record.
   */
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }
}

export default UserRepository;
