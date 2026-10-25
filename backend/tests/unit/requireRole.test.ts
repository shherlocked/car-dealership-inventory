import type { NextFunction, Request, Response } from 'express';
import { requireRole } from '../../src/middleware/requireRole';

const buildRequest = (user?: { id: number; role: string }): Request =>
  ({ user }) as unknown as Request;

const buildResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
};

describe('requireRole middleware', () => {
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next when the user role matches the required role', () => {
    // Arrange
    const req = buildRequest({ id: 1, role: 'ADMIN' });
    const res = buildResponse();
    const middleware = requireRole('ADMIN');

    // Act
    middleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 403 when the user role does not match', () => {
    // Arrange
    const req = buildRequest({ id: 1, role: 'USER' });
    const res = buildResponse();
    const middleware = requireRole('ADMIN');

    // Act
    middleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when req.user is missing', () => {
    // Arrange
    const req = buildRequest(undefined);
    const res = buildResponse();
    const middleware = requireRole('ADMIN');

    // Act
    middleware(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
