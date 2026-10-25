import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const { login, useAuth } = vi.hoisted(() => ({
  login: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    login.mockReset();
    login.mockResolvedValue(undefined);
    useAuth.mockReset();
    useAuth.mockReturnValue({ login, token: null });
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
  }

  function renderPageWithRoutes() {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows validation errors for an invalid email and a short password', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('calls the API on valid submit', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('a@example.com', 'password123'));
  });

  it('shows a server error when the API rejects', async () => {
    login.mockRejectedValue(new Error('Invalid credentials'));
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('disables the submit button while loading', async () => {
    let resolveLogin!: () => void;
    login.mockReturnValue(new Promise<void>((resolve) => (resolveLogin = resolve)));
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    const button = screen.getByRole('button', { name: /log in/i });
    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    await act(async () => {
      resolveLogin();
    });
  });

  it('navigates to / after a successful login', async () => {
    renderPageWithRoutes();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects to / instead of the form when a token is already present', async () => {
    useAuth.mockReturnValue({ login, token: 'jwt-token' });
    renderPageWithRoutes();

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
  });
});
