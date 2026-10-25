import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types';
import Navbar from './Navbar';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const mockUseAuth = vi.mocked(useAuth);

const logout = vi.fn();

function setAuth(token: string | null, user: User | null) {
  mockUseAuth.mockReturnValue({
    user,
    token,
    isAdmin: user?.role === 'ADMIN',
    login: vi.fn(),
    register: vi.fn(),
    logout,
  });
}

describe('Navbar', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    logout.mockReset();
  });

  it('shows the app name', () => {
    setAuth(null, null);
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Showroom')).toBeInTheDocument();
  });

  it('shows the user email and a logout button when logged in', async () => {
    setAuth('jwt', { id: 1, email: 'a@example.com', role: 'USER' });
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText('a@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('shows a slate "User" badge for a regular user', () => {
    setAuth('jwt', { id: 1, email: 'a@example.com', role: 'USER' });
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const badge = screen.getByText('User');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-surface-200');
    expect(badge.className).toContain('text-slate-300');
  });

  it('shows an accent "Admin" badge for an admin', () => {
    setAuth('jwt', { id: 1, email: 'a@example.com', role: 'ADMIN' });
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const badge = screen.getByText('Admin');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-accent-500/15');
    expect(badge.className).toContain('text-accent-300');
  });

  it('does not show a role badge when logged out', () => {
    setAuth(null, null);
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('User')).not.toBeInTheDocument();
  });

  it('shows login and register links when logged out', () => {
    setAuth(null, null);
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });
});
