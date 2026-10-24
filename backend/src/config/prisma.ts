import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client instance.
 * Reused across the app to avoid exhausting database connections.
 */
export const prisma = new PrismaClient();

export default prisma;
