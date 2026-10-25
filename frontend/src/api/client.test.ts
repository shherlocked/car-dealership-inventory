import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getVehicles,
  login,
  purchaseVehicle,
  register,
  searchVehicles,
  setUnauthorizedHandler,
  TOKEN_KEY,
} from './client';

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
    setUnauthorizedHandler(null);
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

  it('getVehicles fetches the full inventory from /api/vehicles', async () => {
    const vehicles = [
      { id: 1, make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 2 },
    ];
    vi.mocked(fetch).mockResolvedValue(okResponse(vehicles));

    const result = await getVehicles();

    expect(result).toEqual(vehicles);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/vehicles',
      expect.anything(),
    );
  });

  it('searchVehicles builds a query string from the provided filters', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse([]));

    await searchVehicles({ make: 'Toy', minPrice: 10000, maxPrice: 30000 });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/vehicles/search?make=Toy&minPrice=10000&maxPrice=30000',
      expect.anything(),
    );
  });

  it('searchVehicles omits unset filters from the query string', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse([]));

    await searchVehicles({});

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/vehicles/search',
      expect.anything(),
    );
  });

  it('purchaseVehicle posts to the purchase endpoint and returns the updated vehicle', async () => {
    const updated = {
      id: 7,
      make: 'Toyota',
      model: 'Corolla',
      category: 'Sedan',
      price: 20000,
      quantity: 1,
    };
    vi.mocked(fetch).mockResolvedValue(okResponse(updated));

    const result = await purchaseVehicle(7);

    expect(result).toEqual(updated);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/vehicles/7/purchase',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('invokes the registered unauthorized handler when an authenticated request returns 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ error: { message: 'Unauthorized' } }, 401),
    );

    await expect(getVehicles()).rejects.toThrow('Unauthorized');

    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not invoke the unauthorized handler for a 401 without a token', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ error: { message: 'Unauthorized' } }, 401),
    );

    await expect(login('a@example.com', 'wrong')).rejects.toThrow('Unauthorized');

    expect(handler).not.toHaveBeenCalled();
  });
});
