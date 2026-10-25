import type { User, Vehicle, VehicleFilters } from '../types';

/** Fields required to create a vehicle, mirroring the backend create schema. */
export interface CreateVehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

/** A partial vehicle update; at least one field must be present. */
export type UpdateVehicleInput = Partial<Omit<Vehicle, 'id'>>;

/** Key under which the auth token is stored in localStorage. */
export const TOKEN_KEY = 'token';

/** Base API URL, read from the environment with a sensible local default. */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/** Reads the persisted token, tolerating environments without localStorage. */
function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Parses a response body as JSON, returning undefined for empty (e.g. 204) bodies. */
async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }
  return response.json();
}

/**
 * Thin fetch wrapper around the backend API.
 * Attaches a bearer token when present and surfaces server error messages.
 *
 * @throws {Error} With the server's `error.message` when the response is not 2xx.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = (await parseBody(response)) as { error?: { message?: string } } | undefined;
    // Only authenticated requests should trigger the global 401 handler.
    if (response.status === 401 && token) {
      unauthorizedHandler?.();
    }
    throw new Error(body?.error?.message ?? `Request failed with status ${response.status}`);
  }

  return (await parseBody(response)) as T;
}

/** Callback invoked when an authenticated request receives a 401. */
type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Registers (or clears, with null) the global 401 handler.
 * The AuthProvider registers this so expired sessions can clear state and
 * redirect to /login without the client importing the router.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

/** Result of a successful login: a signed token plus the user's public profile. */
export interface LoginResult {
  token: string;
  user: User;
}

/** Registers a new user. The backend responds 201 with the created user and no token. */
export function register(email: string, password: string): Promise<User> {
  return request<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** Logs a user in, returning a token and the user's public profile. */
export function login(email: string, password: string): Promise<LoginResult> {
  return request<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** Fetches the full inventory, including vehicles with quantity 0. */
export function getVehicles(): Promise<Vehicle[]> {
  return request<Vehicle[]>('/api/vehicles');
}

/** Searches vehicles with the provided filters; unset filters are omitted. */
export function searchVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  const params = new URLSearchParams();
  if (filters.make !== undefined) params.set('make', filters.make);
  if (filters.model !== undefined) params.set('model', filters.model);
  if (filters.category !== undefined) params.set('category', filters.category);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));

  const query = params.toString();
  return request<Vehicle[]>(`/api/vehicles/search${query ? `?${query}` : ''}`);
}

/** Purchases a vehicle by id, returning the updated vehicle. */
export function purchaseVehicle(id: number): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}/purchase`, { method: 'POST' });
}

/** Creates a vehicle (admin only), returning the created vehicle. */
export function createVehicle(data: CreateVehicleInput): Promise<Vehicle> {
  return request<Vehicle>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Partially updates a vehicle (admin only), returning the updated vehicle. */
export function updateVehicle(id: number, data: UpdateVehicleInput): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Deletes a vehicle (admin only). The backend responds 204 with no body. */
export function deleteVehicle(id: number): Promise<void> {
  return request<void>(`/api/vehicles/${id}`, { method: 'DELETE' });
}

/** Restocks a vehicle by a positive quantity (admin only), returning the updated vehicle. */
export function restockVehicle(id: number, quantity: number): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}/restock`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
}
