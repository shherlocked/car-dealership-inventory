import { useState, type FormEvent } from 'react';
import { PackagePlus } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

interface RestockModalProps {
  vehicleName: string;
  currentStock: number;
  onSubmit: (quantity: number) => Promise<void>;
  onClose: () => void;
}

/**
 * Restock dialog. Accepts a positive integer quantity, shows the current
 * stock, validates client-side and renders any server error inline.
 */
export default function RestockModal({
  vehicleName,
  currentStock,
  onSubmit,
  onClose,
}: RestockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = Number(quantity);
    if (quantity.trim() === '' || Number.isNaN(parsed) || parsed <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!Number.isInteger(parsed)) {
      setError('Quantity must be an integer');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Restock vehicle" onClose={onClose}>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface p-3">
        <PackagePlus className="h-5 w-5 text-accent-400" aria-hidden="true" />
        <p className="text-sm text-slate-300">
          {vehicleName} — current stock: <span className="font-semibold text-white">{currentStock}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="restock-quantity" className="block text-sm font-medium text-slate-300">
            Quantity to add
          </label>
          <input
            id="restock-quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-slate-100 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          />
          {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner />}
            {loading ? 'Restocking…' : 'Restock'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
