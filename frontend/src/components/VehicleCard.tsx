import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { purchaseVehicle } from '../api/client';
import Spinner from './Spinner';
import VehicleIllustration from './VehicleIllustration';
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

/** Deterministic, category-tinted gradient for the card header. */
function gradientFor(category: string): string {
  const tints: Record<string, string> = {
    sedan: 'from-sky-500/30 via-canvas to-canvas',
    suv: 'from-violet-500/30 via-canvas to-canvas',
    hatchback: 'from-emerald-500/30 via-canvas to-canvas',
    truck: 'from-amber-500/30 via-canvas to-canvas',
    coupe: 'from-rose-500/30 via-canvas to-canvas',
    electric: 'from-cyan-500/30 via-canvas to-canvas',
  };
  return tints[category.trim().toLowerCase()] ?? 'from-accent-500/25 via-canvas to-canvas';
}

/** Upcased initials of the make (first letters of each word). */
function initialsOf(make: string): string {
  return make
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/** Stock metadata: text label, tone and a progress ratio out of 10. */
function stockInfo(quantity: number): { label: string; tone: 'ok' | 'warn' | 'danger' } {
  if (quantity === 0) return { label: 'Out of stock', tone: 'danger' };
  if (quantity <= 3) return { label: `Only ${quantity} left`, tone: 'warn' };
  return { label: `${quantity} in stock`, tone: 'ok' };
}

const TONE_TEXT: Record<string, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
};

const TONE_BAR: Record<string, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

/**
 * Presents a single vehicle with a category illustration header, big price,
 * stock indicator with progress bar, purchase action and inline errors. Admins
 * additionally get a compact icon row for Edit, Restock and Delete.
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

  // Reflect parent-side updates (e.g. restock/edit replacing the vehicle).
  useEffect(() => {
    setCurrent(vehicle);
  }, [vehicle]);

  async function handlePurchase() {
    setLoading(true);
    setError(null);
    try {
      const updated = await purchaseVehicle(current.id);
      setCurrent(updated);
      onPurchased(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      onError();
    } finally {
      setLoading(false);
    }
  }

  const outOfStock = current.quantity === 0;
  const stock = stockInfo(current.quantity);
  const stockRatio = Math.min(current.quantity / 10, 1);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-accent-500/40 hover:shadow-card-hover">
      <div
        className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${gradientFor(current.category)}`}
        aria-hidden="true"
      >
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {current.category}
          </span>
        </div>
        <div className="h-full w-4/5">
          <VehicleIllustration category={current.category} initials={initialsOf(current.make)} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-400">
          {current.make}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold text-white">{current.model}</h3>

        <p className="tabular-nums mt-2 font-display text-2xl font-bold text-white">
          {priceFormatter.format(current.price)}
        </p>

        {/* Stock indicator: text plus progress bar so colour is not the only cue. */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-semibold ${TONE_TEXT[stock.tone]}`}>{stock.label}</span>
            <span className="text-xs text-slate-500">
              {stockRatio >= 1 ? 'Full' : `${Math.round(stockRatio * 100)}%`}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full ${TONE_BAR[stock.tone]} transition-all duration-300`}
              style={{ width: `${Math.max(stockRatio * 100, 4)}%` }}
            />
          </div>
        </div>

        {isAdmin && (
          <div className="mt-4 flex items-center gap-2">
            <AdminIconButton
              label={`Edit ${current.make} ${current.model}`}
              onClick={() => onEdit?.(current)}
              tone="default"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </AdminIconButton>
            <AdminIconButton
              label={`Restock ${current.make} ${current.model}`}
              onClick={() => onRestock?.(current)}
              tone="default"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </AdminIconButton>
            <AdminIconButton
              label={`Delete ${current.make} ${current.model}`}
              onClick={() => onDelete?.(current)}
              tone="danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </AdminIconButton>
          </div>
        )}

        <div className="mt-4 flex-1" />

        <button
          type="button"
          onClick={handlePurchase}
          disabled={outOfStock || loading}
          aria-label={`Purchase ${current.make} ${current.model}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-surface-200 disabled:text-slate-500 disabled:shadow-none"
        >
          {loading && <Spinner />}
          {loading ? 'Purchasing…' : outOfStock ? 'Sold out' : 'Purchase'}
        </button>

        <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </div>
    </article>
  );
}

interface AdminIconButtonProps {
  label: string;
  onClick: () => void;
  tone: 'default' | 'danger';
  children: React.ReactNode;
}

function AdminIconButton({ label, onClick, tone, children }: AdminIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg border p-2 transition-colors ${
        tone === 'danger'
          ? 'border-line text-slate-400 hover:border-danger/50 hover:text-danger'
          : 'border-line text-slate-400 hover:border-accent-500/50 hover:text-accent-400'
      }`}
    >
      {children}
    </button>
  );
}
