import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { getAuthToken } from '../helpers/authHelpers';

const validVehicle = {
  make: 'Toyota',
  model: 'Corolla',
  category: 'Sedan',
  price: 20000,
  quantity: 5,
};

/** Seeds a vehicle directly through Prisma to arrange a scenario. */
const seedVehicle = async (overrides: Partial<typeof validVehicle> = {}) =>
  prisma.vehicle.create({ data: { ...validVehicle, ...overrides } });

describe('Inventory: purchase', () => {
  it('decrements stock by exactly 1', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    const vehicle = await seedVehicle({ quantity: 5 });

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(4);
    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored?.quantity).toBe(4);
  });

  it('returns 409 and leaves stock at 0 when purchasing an out-of-stock vehicle', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    const vehicle = await seedVehicle({ quantity: 0 });

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored?.quantity).toBe(0);
  });
});

describe('Inventory: restock', () => {
  it('increases stock by the requested amount', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle({ quantity: 2 });

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 8 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(10);
    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored?.quantity).toBe(10);
  });

  it('restocks an out-of-stock vehicle back to a positive quantity', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle({ quantity: 0 });

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(3);
  });
});

describe('Inventory: concurrency', () => {
  it('allows exactly one of two simultaneous purchases when only one unit is in stock', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    const vehicle = await seedVehicle({ quantity: 1 });

    // Act
    const [first, second] = await Promise.all([
      request(app)
        .post(`/api/vehicles/${vehicle.id}/purchase`)
        .set('Authorization', `Bearer ${token}`),
      request(app)
        .post(`/api/vehicles/${vehicle.id}/purchase`)
        .set('Authorization', `Bearer ${token}`),
    ]);

    // Assert
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored?.quantity).toBe(0);
  });
});
