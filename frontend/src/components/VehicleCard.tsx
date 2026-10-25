import { useEffect, useState } from 'react';
import { purchaseVehicle } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchased: (updated: Vehicle) => void;
  onError: () => void;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  onRestock?: (vehicle: Vehicle) => void;
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** Deterministic two-color gradient derived from the category string. */
function gradientFor(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) % 360;
  }
  const second = (hash + 40) % 360;
  return `linear-gradient(135deg, hsl(${hash} 60% 45%), hsl(${second} 60% 55%))`;
}

/** Upcased initials of the make (first letters of each word). */
function initialsOf(make: string): string {
  return make
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/** Human-readable stock label. */
function stockLabel(quantity: number): string {
  if (quantity === 0) return 'Out of stock';
  if (quantity <= 3) return `Only ${quantity} left`;
  return `${quantity} in stock`;
}

/**
 * Presents a single vehicle with a gradient header, purchase action and
 * inline status messaging for confirmations and errors. Admins additionally
 * get Edit, Restock and Delete actions.
 */
export default function VehicleCard({
  vehicle,
  onPurchased,
  onError,
  onEdit,
  onDelete,
  onRestock,
}: VehicleCardProps) {
  const { isAdmin } = useAuth();
  const [current, setCurrent] = useState(vehicle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Reflect parent-side updates (e.g. restock/edit replacing the vehicle).
  useEffect(() => {
    setCurrent(vehicle);
  }, [vehicle]);

  async function handlePurchase() {
    setLoading(true);
    setError(null);
    setConfirmed(false);
    try {
      const updated = await purchaseVehicle(current.id);
      setCurrent(updated);
      setConfirmed(true);
      onPurchased(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      onError();
    } finally {
      setLoading(false);
    }
  }

  const outOfStock = current.quantity === 0;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="flex h-24 items-center justify-center"
        style={{ background: gradientFor(current.category) }}
        aria-hidden="true"
      >
        <span className="text-2xl font-semibold text-white">{initialsOf(current.make)}</span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {current.make} {current.model}
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {current.category}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-500">{priceFormatter.format(current.price)}</p>

        <p
          className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
            outOfStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {stockLabel(current.quantity)}
        </p>

        {isAdmin && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(current)}
              aria-label={`Edit ${current.make} ${current.model}`}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRestock?.(current)}
              aria-label={`Restock ${current.make} ${current.model}`}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Restock
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(current)}
              aria-label={`Delete ${current.make} ${current.model}`}
              className="flex-1 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={handlePurchase}
            disabled={outOfStock || loading}
            aria-label={`Purchase ${current.make} ${current.model}`}
            className="w-full rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Purchasing…' : 'Purchase'}
          </button>
        </div>

        <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
          {confirmed && <p className="text-sm text-emerald-700">Purchase confirmed</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </article>
  );
}
