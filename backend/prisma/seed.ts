import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';

/** Bcrypt cost factor, kept in sync with the auth service. */
const BCRYPT_ROUNDS = 10;

const DEFAULT_ADMIN_EMAIL = 'admin@dealership.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@12345';
const REGULAR_USER_EMAIL = 'user@dealership.com';
const REGULAR_USER_PASSWORD = 'User@12345';

/** Sample vehicle used to populate an empty inventory. */
interface SampleVehicle {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

/** Twelve varied vehicles across all supported categories. */
const SAMPLE_VEHICLES: SampleVehicle[] = [
  { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 8 },
  { make: 'Honda', model: 'Accord', category: 'Sedan', price: 27500, quantity: 0 },
  { make: 'Ford', model: 'Explorer', category: 'SUV', price: 42000, quantity: 5 },
  { make: 'Jeep', model: 'Grand Cherokee', category: 'SUV', price: 45500, quantity: 3 },
  { make: 'Volkswagen', model: 'Golf', category: 'Hatchback', price: 22000, quantity: 12 },
  { make: 'Hyundai', model: 'i20', category: 'Hatchback', price: 18500, quantity: 0 },
  { make: 'Ford', model: 'F-150', category: 'Truck', price: 52000, quantity: 4 },
  { make: 'Chevrolet', model: 'Silverado', category: 'Truck', price: 49500, quantity: 2 },
  { make: 'Mazda', model: 'MX-5 Miata', category: 'Coupe', price: 31000, quantity: 6 },
  { make: 'BMW', model: 'M4', category: 'Coupe', price: 78000, quantity: 1 },
  { make: 'Tesla', model: 'Model 3', category: 'Electric', price: 41000, quantity: 9 },
  { make: 'Nissan', model: 'Leaf', category: 'Electric', price: 29500, quantity: 7 },
];

/**
 * Creates or updates a user, always enforcing the given role.
 *
 * @param email Unique email address.
 * @param password Plaintext password to hash.
 * @param role Role to assign (e.g. ADMIN or USER).
 * @returns Whether the user was newly created.
 */
async function upsertUser(email: string, password: string, role: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, passwordHash, role },
  });

  return existing === null;
}

/**
 * Inserts the sample vehicles only when the inventory is empty.
 *
 * @returns The number of vehicles inserted.
 */
async function seedVehicles(): Promise<number> {
  const existingCount = await prisma.vehicle.count();
  if (existingCount > 0) {
    return 0;
  }

  await prisma.vehicle.createMany({ data: SAMPLE_VEHICLES });
  return SAMPLE_VEHICLES.length;
}

/** Runs the seed and prints a short summary. */
async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  const adminCreated = await upsertUser(adminEmail, adminPassword, 'ADMIN');
  const userCreated = await upsertUser(REGULAR_USER_EMAIL, REGULAR_USER_PASSWORD, 'USER');
  const vehiclesCreated = await seedVehicles();

  console.log('Seed complete:');
  console.log(`  Admin user (${adminEmail}): ${adminCreated ? 'created' : 'updated'}`);
  console.log(`  Regular user (${REGULAR_USER_EMAIL}): ${userCreated ? 'created' : 'updated'}`);
  console.log(
    vehiclesCreated > 0
      ? `  Vehicles: inserted ${vehiclesCreated} sample records`
      : '  Vehicles: skipped (inventory already populated)',
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
