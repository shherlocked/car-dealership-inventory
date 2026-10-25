import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './RegisterPage';

const register = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register }),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    register.mockReset();
    register.mockResolvedValue(undefined);
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login page</div>} />
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
});
