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

describe('POST /api/vehicles', () => {
  it('responds 201 with the created vehicle for an ADMIN', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');

    // Act
    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(validVehicle);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(Number),
      make: validVehicle.make,
      model: validVehicle.model,
      category: validVehicle.category,
      price: validVehicle.price,
      quantity: validVehicle.quantity,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('responds 400 when the body is invalid', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const invalidBody = { make: '', model: 'Corolla', category: 'Sedan', price: -1 };

    // Act
    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidBody);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.error.message).toBe('string');
  });

  it('responds 403 for a USER', async () => {
    // Arrange
    const token = await getAuthToken('USER');

    // Act
    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(validVehicle);

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 401 without a token', async () => {
    // Act
    const response = await request(app).post('/api/vehicles').send(validVehicle);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('GET /api/vehicles', () => {
  it('responds 200 with all vehicles, including out-of-stock ones', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    await seedVehicle({ make: 'Toyota', model: 'Corolla', quantity: 3 });
    await seedVehicle({ make: 'Honda', model: 'Civic', quantity: 0 });

    // Act
    const response = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((v: { quantity: number }) => v.quantity)).toEqual(
      expect.arrayContaining([3, 0]),
    );
  });

  it('responds 401 without a token', async () => {
    // Act
    const response = await request(app).get('/api/vehicles');

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('GET /api/vehicles/search', () => {
  it('filters by make as a case-insensitive partial match', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    await seedVehicle({ make: 'Toyota', model: 'Corolla' });
    await seedVehicle({ make: 'Honda', model: 'Civic' });

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'toy' })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].make).toBe('Toyota');
  });

  it('filters by model as a case-insensitive partial match', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    await seedVehicle({ make: 'Toyota', model: 'Corolla' });
    await seedVehicle({ make: 'Honda', model: 'Civic' });

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ model: 'CIV' })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].model).toBe('Civic');
  });

  it('filters by category as a case-insensitive match', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    await seedVehicle({ make: 'Toyota', model: 'Corolla', category: 'Sedan' });
    await seedVehicle({ make: 'Ford', model: 'F-150', category: 'Truck' });

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ category: 'sedan' })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].category).toBe('Sedan');
  });

  it('filters by an inclusive price range', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    await seedVehicle({ make: 'A', model: 'A', price: 10000 });
    await seedVehicle({ make: 'B', model: 'B', price: 20000 });
    await seedVehicle({ make: 'C', model: 'C', price: 30000 });

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ minPrice: 10000, maxPrice: 20000 })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((v: { price: number }) => v.price).sort()).toEqual([10000, 20000]);
  });

  it('combines multiple filters', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    await seedVehicle({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000 });
    await seedVehicle({ make: 'Toyota', model: 'Hilux', category: 'Truck', price: 20000 });
    await seedVehicle({ make: 'Honda', model: 'Civic', category: 'Sedan', price: 20000 });

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'toyota', category: 'sedan', minPrice: 15000, maxPrice: 25000 })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].model).toBe('Corolla');
  });

  it('responds 400 when minPrice is greater than maxPrice', async () => {
    // Arrange
    const token = await getAuthToken('USER');

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ minPrice: 50000, maxPrice: 10000 })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 400 when a price is not a number', async () => {
    // Arrange
    const token = await getAuthToken('USER');

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ minPrice: 'not-a-number' })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('is not shadowed by the /:id route', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    await seedVehicle({ make: 'Toyota', model: 'Corolla' });

    // Act
    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'Toyota' })
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
  });

  it('responds 401 without a token', async () => {
    // Act
    const response = await request(app).get('/api/vehicles/search').query({ make: 'Toyota' });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('responds 200 with the updated vehicle for an ADMIN', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle({ price: 20000 });

    // Act
    const response = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 25000 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: vehicle.id, price: 25000 });
  });

  it('responds 404 when the vehicle does not exist', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');

    // Act
    const response = await request(app)
      .put('/api/vehicles/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 25000 });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 400 when the body is invalid', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: -5 });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 400 when the id is not an integer', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');

    // Act
    const response = await request(app)
      .put('/api/vehicles/not-an-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 25000 });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 403 for a USER', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .put(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 25000 });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 401 without a token', async () => {
    // Arrange
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app).put(`/api/vehicles/${vehicle.id}`).send({ price: 25000 });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('responds 204 and removes the vehicle for an ADMIN', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(204);
    await expect(prisma.vehicle.findUnique({ where: { id: vehicle.id } })).resolves.toBeNull();
  });

  it('responds 404 when the vehicle does not exist', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');

    // Act
    const response = await request(app)
      .delete('/api/vehicles/999999')
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 403 for a USER', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 401 without a token', async () => {
    // Arrange
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app).delete(`/api/vehicles/${vehicle.id}`);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/vehicles/:id/purchase', () => {
  it('responds 200 with the updated vehicle for any authenticated user', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    const vehicle = await seedVehicle({ quantity: 3 });

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: vehicle.id, quantity: 2 });
  });

  it('responds 409 when the vehicle is out of stock', async () => {
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
  });

  it('responds 404 when the vehicle does not exist', async () => {
    // Arrange
    const token = await getAuthToken('USER');

    // Act
    const response = await request(app)
      .post('/api/vehicles/999999/purchase')
      .set('Authorization', `Bearer ${token}`);

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 401 without a token', async () => {
    // Arrange
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app).post(`/api/vehicles/${vehicle.id}/purchase`);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/vehicles/:id/restock', () => {
  it('responds 200 with the updated vehicle for an ADMIN', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle({ quantity: 2 });

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: vehicle.id, quantity: 7 });
  });

  it('responds 400 when the quantity is 0', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 0 });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 400 when the quantity is negative', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: -3 });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 400 when the quantity is not an integer', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1.5 });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 403 for a USER', async () => {
    // Arrange
    const token = await getAuthToken('USER');
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 404 when the vehicle does not exist', async () => {
    // Arrange
    const token = await getAuthToken('ADMIN');

    // Act
    const response = await request(app)
      .post('/api/vehicles/999999/restock')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 401 without a token', async () => {
    // Arrange
    const vehicle = await seedVehicle();

    // Act
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .send({ quantity: 5 });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});
