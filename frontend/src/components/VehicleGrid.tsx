import { AlertTriangle, SearchX } from 'lucide-react';
import type { Vehicle } from '../types';
import VehicleCard from './VehicleCard';

interface VehicleGridProps {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  onClearFilters: () => void;
  onRetry: () => void;
  onPurchased: (updated: Vehicle) => void;
  onError: () => void;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  onRestock?: (vehicle: Vehicle) => void;
}

/**
 * Responsive grid of vehicle cards with shimmer skeleton loading, an
 * illustrated empty state and an error state with retry.
 */
export default function VehicleGrid({
  vehicles,
  loading,
  error,
  onClearFilters,
  onRetry,
  onPurchased,
  onError,
  onEdit,
  onDelete,
  onRestock,
}: VehicleGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl2 border border-line bg-surface p-10 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-muted">
          <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold text-white">
          We couldn't load the showroom
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-lg bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110"
        >
          Retry
        </button>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="rounded-xl2 border border-line bg-surface p-10 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-200">
          <SearchX className="h-6 w-6 text-slate-400" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold text-white">
          No vehicles match your filters
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          Try adjusting the filters to see more of the inventory.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 rounded-lg border border-line bg-surface-raised px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-accent-500/50 hover:text-white"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((vehicle, index) => (
        <div
          key={vehicle.id}
          className="animate-card"
          style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
        >
          <VehicleCard
            vehicle={vehicle}
            onPurchased={onPurchased}
            onError={onError}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestock={onRestock}
          />
        </div>
      ))}
    </div>
  );
}

/** Shimmer placeholder matching the vehicle card layout. */
function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-xl2 border border-line bg-surface shadow-card"
      aria-hidden="true"
    >
      <div className="h-36 animate-pulse bg-surface-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-200" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-surface-200" />
        <div className="h-7 w-1/2 animate-pulse rounded bg-surface-200" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-surface-200" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-200" />
      </div>
    </div>
  );
}
