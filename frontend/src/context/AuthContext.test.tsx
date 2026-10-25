import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types';
import { AuthProvider, useAuth } from './AuthContext';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('../api/client', () => ({
  login: vi.fn(),
  register: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  TOKEN_KEY: 'token',
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

import { login, register, setUnauthorizedHandler } from '../api/client';

const USER_KEY = 'user';

/** Minimal consumer exposing the auth context for assertions. */
function Consumer() {
  const { user, token, isAdmin, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <button onClick={() => login('a@example.com', 'password123')}>login</button>
      <button onClick={() => register('a@example.com', 'password123')}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

const user: User = { id: 1, email: 'a@example.com', role: 'ADMIN' };

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(login).mockReset();
    vi.mocked(register).mockReset();
    vi.mocked(setUnauthorizedHandler).mockReset();
    navigate.mockReset();
  });

  it('starts with no token and no user', () => {
    renderWithProvider();
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
  });

  it('login stores the token and user in state and localStorage', async () => {
    vi.mocked(login).mockResolvedValue({ token: 'jwt-token', user });

    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('jwt-token');
      expect(screen.getByTestId('user')).toHaveTextContent('a@example.com');
    });
    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toEqual(user);
  });

  it('logout clears token and user from state and localStorage', async () => {
    vi.mocked(login).mockResolvedValue({ token: 'jwt-token', user });
    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('jwt-token'));

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('isAdmin is true only for ADMIN role users', async () => {
    vi.mocked(login).mockResolvedValue({ token: 'jwt-token', user });

    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('isAdmin')).toHaveTextContent('true'));
  });

  it('register calls the API but does not log the user in', async () => {
    vi.mocked(register).mockResolvedValue({ id: 2, email: 'b@example.com', role: 'USER' });

    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'register' }));

    await waitFor(() => expect(register).toHaveBeenCalledWith('a@example.com', 'password123'));
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('registers a 401 handler that clears the session and navigates to /login', async () => {
    vi.mocked(login).mockResolvedValue({ token: 'jwt-token', user });

    renderWithProvider();
    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('jwt-token'));

    expect(setUnauthorizedHandler).toHaveBeenCalledTimes(1);
    const handler = vi.mocked(setUnauthorizedHandler).mock.calls[0][0] as () => void;

    act(() => {
      handler();
    });

    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
