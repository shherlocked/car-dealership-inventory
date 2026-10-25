import type { User } from '../types';

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
    throw new Error(body?.error?.message ?? `Request failed with status ${response.status}`);
  }

  return (await parseBody(response)) as T;
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
