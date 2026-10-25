import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/authService';
import { UserRepository } from '../../src/repositories/userRepository';
import { AppError } from '../../src/utils/AppError';

jest.mock('../../src/repositories/userRepository');

type MockedUserRepository = jest.Mocked<UserRepository>;

const buildUser = (overrides: Partial<{ id: number; email: string; passwordHash: string; role: string }> = {}) => ({
  id: 1,
  email: 'jane@example.com',
  passwordHash: 'hashed-password',
  role: 'USER',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('AuthService', () => {
  let userRepository: MockedUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    userRepository = new UserRepository() as MockedUserRepository;
    authService = new AuthService(userRepository);
  });

  describe('register', () => {
    it('creates a user and returns id, email and role without the password hash', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(buildUser({ id: 7, email: 'new@example.com' }));

      // Act
      const result = await authService.register('new@example.com', 'Password123!');

      // Assert
      expect(result).toEqual({ id: 7, email: 'new@example.com', role: 'USER' });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('password');
    });

    it('hashes the password with bcrypt and never stores the plaintext', async () => {
      // Arrange
      const plainPassword = 'Password123!';
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(buildUser());

      // Act
      await authService.register('new@example.com', plainPassword);

      // Assert
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      const createArg = userRepository.create.mock.calls[0][0];
      expect(createArg.passwordHash).not.toBe(plainPassword);
      expect(createArg.passwordHash).not.toContain(plainPassword);
      await expect(bcrypt.compare(plainPassword, createArg.passwordHash)).resolves.toBe(true);
    });

    it('always assigns the USER role regardless of caller input', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(buildUser({ role: 'USER' }));

      // Act
      const result = await authService.register('new@example.com', 'Password123!');

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'USER' }),
      );
      expect(result.role).toBe('USER');
    });

    it('throws an AppError with status 409 when the email already exists', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(buildUser({ email: 'taken@example.com' }));

      // Act
      const action = authService.register('taken@example.com', 'Password123!');

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 409 });
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a verifiable JWT whose payload contains the user id and role', async () => {
      // Arrange
      const password = 'Password123!';
      const passwordHash = await bcrypt.hash(password, 10);
      userRepository.findByEmail.mockResolvedValue(
        buildUser({ id: 42, email: 'jane@example.com', passwordHash, role: 'ADMIN' }),
      );

      // Act
      const result = await authService.login('jane@example.com', password);

      // Assert
      expect(result.user).toEqual({ id: 42, email: 'jane@example.com', role: 'ADMIN' });
      expect(result).not.toHaveProperty('passwordHash');

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
      expect(decoded.sub).toBe('42');
      expect(decoded.role).toBe('ADMIN');
    });

    it('throws an AppError with status 401 when the email is unknown', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      const action = authService.login('missing@example.com', 'Password123!');

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws an AppError with status 401 when the password is wrong', async () => {
      // Arrange
      const passwordHash = await bcrypt.hash('CorrectPassword1!', 10);
      userRepository.findByEmail.mockResolvedValue(buildUser({ passwordHash }));

      // Act
      const action = authService.login('jane@example.com', 'WrongPassword1!');

      // Assert
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ statusCode: 401 });
    });

    it('uses the same generic error message for unknown email and wrong password', async () => {
      // Arrange
      const passwordHash = await bcrypt.hash('CorrectPassword1!', 10);
      userRepository.findByEmail.mockResolvedValueOnce(null);
      userRepository.findByEmail.mockResolvedValueOnce(buildUser({ passwordHash }));

      // Act
      const unknownEmailError = await authService
        .login('missing@example.com', 'Password123!')
        .catch((error: unknown) => error);
      const wrongPasswordError = await authService
        .login('jane@example.com', 'WrongPassword1!')
        .catch((error: unknown) => error);

      // Assert
      expect(unknownEmailError).toBeInstanceOf(AppError);
      expect(wrongPasswordError).toBeInstanceOf(AppError);
      expect((unknownEmailError as AppError).message).toBe('Invalid credentials');
      expect((wrongPasswordError as AppError).message).toBe('Invalid credentials');
    });
  });
});
