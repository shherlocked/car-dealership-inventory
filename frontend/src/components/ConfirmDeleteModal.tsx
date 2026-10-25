import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

interface ConfirmDeleteModalProps {
  vehicleName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Delete confirmation dialog. Names the vehicle, shows a destructive Delete
 * action with a loading state, and renders any server error inline.
 */
export default function ConfirmDeleteModal({
  vehicleName,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Delete vehicle" onClose={onCancel}>
      <div className="mt-3 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-muted p-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        <p className="text-sm text-slate-200">
          Are you sure you want to delete <span className="font-medium text-white">{vehicleName}</span>?
          This action cannot be undone.
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Spinner />}
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}
