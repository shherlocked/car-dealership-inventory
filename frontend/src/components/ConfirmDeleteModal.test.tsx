import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmDeleteModal from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    onConfirm.mockReset();
    onCancel.mockReset();
  });

  function renderModal() {
    return render(
      <ConfirmDeleteModal
        vehicleName="Toyota Camry"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
  }

  it('names the vehicle and shows Cancel and Delete buttons', () => {
    renderModal();

    expect(screen.getByText(/Toyota Camry/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows a loading state and calls onConfirm on success', async () => {
    let resolveConfirm!: () => void;
    onConfirm.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      }),
    );

    renderModal();
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await userEvent.click(deleteButton);

    await waitFor(() => expect(deleteButton).toBeDisabled());
    expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();

    await act(async () => {
      resolveConfirm();
    });
  });

  it('shows the server error inside the modal', async () => {
    onConfirm.mockRejectedValue(new Error('Cannot delete'));

    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Cannot delete')).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
