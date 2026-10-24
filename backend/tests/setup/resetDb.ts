import { prisma } from '../../src/config/prisma';

/**
 * Resets all tables between tests to guarantee isolation.
 * Deletion order respects foreign-key constraints.
 */
beforeEach(async () => {
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
