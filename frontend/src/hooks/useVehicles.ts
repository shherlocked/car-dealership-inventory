import { useCallback, useEffect, useRef, useState } from 'react';
import { getVehicles, searchVehicles } from '../api/client';
import type { Vehicle, VehicleFilters } from '../types';

/** True when at least one filter field has a meaningful value. */
function hasFilters(filters: VehicleFilters): boolean {
  return Object.values(filters).some((value) => value !== undefined && value !== '');
}

/** State and actions for the vehicle inventory list. */
export interface UseVehiclesResult {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  applyFilters: (filters: VehicleFilters) => Promise<void>;
  refresh: () => Promise<void>;
  replaceVehicle: (updated: Vehicle) => void;
}

/**
 * Loads vehicles and exposes filtering, refreshing and local replacement.
 * Uses the search endpoint only when at least one filter is set and ignores
 * stale responses by tracking the latest request id.
 */
export function useVehicles(): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef<VehicleFilters>({});
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const filters = filtersRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = hasFilters(filters) ? await searchVehicles(filters) : await getVehicles();
      if (requestId === requestIdRef.current) {
        setVehicles(data);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = useCallback(
    async (filters: VehicleFilters) => {
      filtersRef.current = filters;
      await load();
    },
    [load],
  );

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const replaceVehicle = useCallback((updated: Vehicle) => {
    setVehicles((current) =>
      current.map((vehicle) => (vehicle.id === updated.id ? updated : vehicle)),
    );
  }, []);

  return { vehicles, loading, error, applyFilters, refresh, replaceVehicle };
}
