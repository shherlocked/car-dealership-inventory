import { useMemo } from 'react';
import VehicleFilters from '../components/VehicleFilters';
import VehicleGrid from '../components/VehicleGrid';
import { useVehicles } from '../hooks/useVehicles';

/**
 * Inventory dashboard: header with result count, filters and the vehicle grid.
 */
export default function DashboardPage() {
  const { vehicles, loading, error, applyFilters, refresh, replaceVehicle } = useVehicles();

  const categories = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.category))).sort(),
    [vehicles],
  );

  function clearFilters() {
    void applyFilters({});
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Available vehicles</h1>
        <p className="text-sm text-slate-500">
          {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
        </p>
      </header>

      <div className="mt-6">
        <VehicleFilters categories={categories} onApply={(filters) => void applyFilters(filters)} />
      </div>

      <div className="mt-8">
        <VehicleGrid
          vehicles={vehicles}
          loading={loading}
          error={error}
          onClearFilters={clearFilters}
          onRetry={() => void refresh()}
          onPurchased={replaceVehicle}
          onError={() => void refresh()}
        />
      </div>
    </div>
  );
}
