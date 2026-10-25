import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const mockUseAuth = vi.mocked(useAuth);

/** Renders the route under test with a public /login route to capture redirects. */
function renderRoute({ adminOnly = false }: { adminOnly?: boolean } = {}) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute adminOnly={adminOnly}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

function setAuth(token: string | null, user: User | null) {
  mockUseAuth.mockReturnValue({
    user,
    token,
    isAdmin: user?.role === 'ADMIN',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('renders children when a token is present', () => {
    setAuth('jwt', { id: 1, email: 'a@example.com', role: 'USER' });

    renderRoute();

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to /login when there is no token', () => {
    setAuth(null, null);

    renderRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children for admins when adminOnly is set', () => {
    setAuth('jwt', { id: 1, email: 'a@example.com', role: 'ADMIN' });

    renderRoute({ adminOnly: true });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects non-admin users to / when adminOnly is set', () => {
    setAuth('jwt', { id: 1, email: 'a@example.com', role: 'USER' });

    renderRoute({ adminOnly: true });

    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
