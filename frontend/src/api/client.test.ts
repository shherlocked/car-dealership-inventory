import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, register, TOKEN_KEY } from './client';

const okResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('register posts to /api/auth/register with the payload and returns the created user', async () => {
    const user = { id: 1, email: 'a@example.com', role: 'USER' };
    vi.mocked(fetch).mockResolvedValue(okResponse(user, 201));

    const result = await register('a@example.com', 'password123');

    expect(result).toEqual(user);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@example.com', password: 'password123' }),
      }),
    );
  });

  it('login posts to /api/auth/login and returns token and user', async () => {
    const payload = { token: 'jwt', user: { id: 1, email: 'a@example.com', role: 'ADMIN' } };
    vi.mocked(fetch).mockResolvedValue(okResponse(payload, 200));

    const result = await login('a@example.com', 'password123');

    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('attaches an Authorization bearer header when a token exists', async () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    vi.mocked(fetch).mockResolvedValue(okResponse({}));

    await login('a@example.com', 'password123');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer abc');
  });

  it('omits the Authorization header when no token exists', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse({}));

    await login('a@example.com', 'password123');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.has('Authorization')).toBe(false);
  });

  it('throws an Error carrying the server error message on non-2xx responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ error: { message: 'Invalid credentials' } }, 401),
    );

    await expect(login('a@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('resolves without parsing a body on 204 responses', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    const result = await login('a@example.com', 'password123');

    expect(result).toBeUndefined();
  });
});
