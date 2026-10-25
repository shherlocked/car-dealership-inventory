import { useState, type FormEvent } from 'react';
import Modal from './Modal';

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
      <p className="mt-3 text-sm text-slate-600">
        {vehicleName} — current stock: <span className="font-medium">{currentStock}</span>
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="restock-quantity" className="block text-sm font-medium text-slate-700">
            Quantity to add
          </label>
          <input
            id="restock-quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Restocking…' : 'Restock'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
