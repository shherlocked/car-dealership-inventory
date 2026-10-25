import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const login = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    login.mockReset();
    login.mockResolvedValue(undefined);
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <LoginPage />
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
});
