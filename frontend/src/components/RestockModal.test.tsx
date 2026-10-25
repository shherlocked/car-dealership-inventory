import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RestockModal from './RestockModal';

describe('RestockModal', () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
    onClose.mockReset();
  });

  function renderModal() {
    return render(
      <RestockModal vehicleName="Toyota Camry" currentStock={5} onSubmit={onSubmit} onClose={onClose} />,
    );
  }

  it('shows the current stock and a quantity input', () => {
    renderModal();

    expect(screen.getByText(/current stock/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  it('rejects 0 with a validation error and does not submit', async () => {
    renderModal();

    await userEvent.type(screen.getByLabelText(/quantity/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /restock/i }));

    expect(await screen.findByText(/quantity must be greater than 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects negative values with a validation error', async () => {
    renderModal();

    await userEvent.type(screen.getByLabelText(/quantity/i), '-3');
    await userEvent.click(screen.getByRole('button', { name: /restock/i }));

    expect(await screen.findByText(/quantity must be greater than 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects decimals with a validation error', async () => {
    renderModal();

    await userEvent.type(screen.getByLabelText(/quantity/i), '2.5');
    await userEvent.click(screen.getByRole('button', { name: /restock/i }));

    expect(await screen.findByText(/quantity must be an integer/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the positive integer quantity', async () => {
    renderModal();

    await userEvent.type(screen.getByLabelText(/quantity/i), '4');
    await userEvent.click(screen.getByRole('button', { name: /restock/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(4));
  });

  it('shows the server error inside the modal', async () => {
    onSubmit.mockRejectedValue(new Error('Restock failed'));

    renderModal();
    await userEvent.type(screen.getByLabelText(/quantity/i), '4');
    await userEvent.click(screen.getByRole('button', { name: /restock/i }));

    expect(await screen.findByText('Restock failed')).toBeInTheDocument();
  });
});
