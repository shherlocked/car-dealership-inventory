import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

interface HarnessProps {
  onCloseSpy?: () => void;
}

/** Opens the modal via a trigger button so focus return can be asserted. */
function Harness({ onCloseSpy }: HarnessProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      {open && (
        <Modal
          title="Test dialog"
          onClose={() => {
            setOpen(false);
            onCloseSpy?.();
          }}
        >
          <button type="button">First</button>
          <input aria-label="field" />
          <button type="button">Last</button>
        </Modal>
      )}
    </div>
  );
}

describe('Modal', () => {
  it('renders an accessible dialog labelled by its title', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    const dialog = screen.getByRole('dialog', { name: 'Test dialog' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('closes when Escape is pressed', async () => {
    const onCloseSpy = vi.fn();
    render(<Harness onCloseSpy={onCloseSpy} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    await userEvent.keyboard('{Escape}');

    expect(onCloseSpy).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when the backdrop is clicked but not when the dialog is clicked', async () => {
    const onCloseSpy = vi.fn();
    render(<Harness onCloseSpy={onCloseSpy} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    // Clicking inside the dialog must not close it.
    await userEvent.click(screen.getByRole('dialog'));
    expect(onCloseSpy).not.toHaveBeenCalled();

    // Clicking the backdrop must close it.
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onCloseSpy).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus into the dialog when opened and traps Tab within it', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open modal' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();

    // Focus the last focusable element and Tab forward: focus wraps to first.
    screen.getByRole('button', { name: 'Last' }).focus();
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('returns focus to the trigger when closed', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open modal' });
    await userEvent.click(trigger);

    await userEvent.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
  });
});
