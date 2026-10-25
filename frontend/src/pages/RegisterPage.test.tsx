import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './RegisterPage';

const { register, useAuth } = vi.hoisted(() => ({
  register: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    register.mockReset();
    register.mockResolvedValue(undefined);
    useAuth.mockReset();
    useAuth.mockReturnValue({ register, token: null });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows a validation error when the passwords do not match', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('calls the API on valid submit and redirects to /login', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => expect(register).toHaveBeenCalledWith('a@example.com', 'password123'));
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('shows a server error when the API rejects', async () => {
    register.mockRejectedValue(new Error('Email is already registered'));
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email is already registered')).toBeInTheDocument();
  });

  it('redirects to / instead of the form when a token is already present', async () => {
    useAuth.mockReturnValue({ register, token: 'jwt-token' });
    renderPage();

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument();
  });
});
