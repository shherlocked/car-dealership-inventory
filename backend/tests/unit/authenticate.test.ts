import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { authenticate } from '../../src/middleware/authenticate';

const JWT_SECRET = process.env.JWT_SECRET as string;

const signToken = (
  payload: Record<string, unknown>,
  options: SignOptions = {},
): string => jwt.sign(payload, JWT_SECRET, options);

const buildRequest = (authorization?: string): Request =>
  ({ headers: authorization ? { authorization } : {} }) as unknown as Request;

const buildResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
};

describe('authenticate middleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('responds 401 when the Authorization header is missing', () => {
    // Arrange
    const req = buildRequest();
    const res = buildResponse();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when the Authorization header is malformed', () => {
    // Arrange
    const req = buildRequest('Token abc.def.ghi');
    const res = buildResponse();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when the token is invalid', () => {
    // Arrange
    const req = buildRequest('Bearer not-a-real-token');
    const res = buildResponse();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when the token is expired', () => {
    // Arrange
    const expiredToken = signToken({ sub: '1', role: 'USER' }, { expiresIn: -10 });
    const req = buildRequest(`Bearer ${expiredToken}`);
    const res = buildResponse();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user with a numeric id and role for a valid token', () => {
    // Arrange
    const token = signToken({ sub: '5', role: 'ADMIN' });
    const req = buildRequest(`Bearer ${token}`);
    const res = buildResponse();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect((req as Request & { user?: { id: number; role: string } }).user).toEqual({
      id: 5,
      role: 'ADMIN',
    });
    expect(res.status).not.toHaveBeenCalled();
  });
});
