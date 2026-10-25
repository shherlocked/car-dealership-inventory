import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';

const VALID_EMAIL = 'new-user@example.com';
const VALID_PASSWORD = 'Password123!';

const expectNoSecrets = (body: Record<string, unknown>): void => {
  expect(body).not.toHaveProperty('passwordHash');
  expect(body).not.toHaveProperty('password');
  expect(JSON.stringify(body)).not.toContain('passwordHash');
};

describe('POST /api/auth/register', () => {
  it('creates a user and responds 201 with id, email and role only', async () => {
    // Arrange
    const payload = { email: VALID_EMAIL, password: VALID_PASSWORD };

    // Act
    const response = await request(app).post('/api/auth/register').send(payload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(Number),
      email: VALID_EMAIL,
      role: 'USER',
    });
    expectNoSecrets(response.body);
  });

  it('persists a hashed password rather than the plaintext', async () => {
    // Arrange
    const payload = { email: VALID_EMAIL, password: VALID_PASSWORD };

    // Act
    await request(app).post('/api/auth/register').send(payload);
    const stored = await prisma.user.findUnique({ where: { email: VALID_EMAIL } });

    // Assert
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toBe(VALID_PASSWORD);
    expect(stored?.passwordHash).not.toContain(VALID_PASSWORD);
  });

  it('responds 400 when the email is invalid', async () => {
    // Arrange
    const payload = { email: 'not-an-email', password: VALID_PASSWORD };

    // Act
    const response = await request(app).post('/api/auth/register').send(payload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.error.message).toBe('string');
  });

  it('responds 400 when the password is shorter than 8 characters', async () => {
    // Arrange
    const payload = { email: VALID_EMAIL, password: 'short' };

    // Act
    const response = await request(app).post('/api/auth/register').send(payload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.error.message).toBe('string');
  });

  it('responds 409 when the email is already registered', async () => {
    // Arrange
    const payload = { email: VALID_EMAIL, password: VALID_PASSWORD };
    await request(app).post('/api/auth/register').send(payload);

    // Act
    const response = await request(app).post('/api/auth/register').send(payload);

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/login', () => {
  it('responds 200 with a token and user after a successful registration', async () => {
    // Arrange
    const credentials = { email: VALID_EMAIL, password: VALID_PASSWORD };
    await request(app).post('/api/auth/register').send(credentials);

    // Act
    const response = await request(app).post('/api/auth/login').send(credentials);

    // Assert
    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.user).toEqual({
      id: expect.any(Number),
      email: VALID_EMAIL,
      role: 'USER',
    });
    expectNoSecrets(response.body);
    expectNoSecrets(response.body.user);
  });

  it('responds 401 for an unknown email', async () => {
    // Arrange
    const credentials = { email: 'missing@example.com', password: VALID_PASSWORD };

    // Act
    const response = await request(app).post('/api/auth/login').send(credentials);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 401 for a wrong password', async () => {
    // Arrange
    await request(app)
      .post('/api/auth/register')
      .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

    // Act
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_EMAIL, password: 'WrongPassword1!' });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('responds 400 when required fields are missing', async () => {
    // Arrange
    const payload = { email: VALID_EMAIL };

    // Act
    const response = await request(app).post('/api/auth/login').send(payload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
