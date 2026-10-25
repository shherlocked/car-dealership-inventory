import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import { getVehicles, searchVehicles } from '../api/client';
import { useVehicles } from './useVehicles';

vi.mock('../api/client', () => ({
  getVehicles: vi.fn(),
  searchVehicles: vi.fn(),
}));

const vehicle = (id: number, make = 'Toyota'): Vehicle => ({
  id,
  make,
  model: `Model ${id}`,
  category: 'Sedan',
  price: 20000 + id,
  quantity: 2,
});

describe('useVehicles', () => {
  beforeEach(() => {
    vi.mocked(getVehicles).mockReset();
    vi.mocked(searchVehicles).mockReset();
  });

  it('loads vehicles from the list endpoint on mount', async () => {
    const list = [vehicle(1), vehicle(2)];
    vi.mocked(getVehicles).mockResolvedValue(list);

    const { result } = renderHook(() => useVehicles());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.vehicles).toEqual(list);
    expect(result.current.error).toBeNull();
    expect(getVehicles).toHaveBeenCalledOnce();
  });

  it('uses the search endpoint when at least one filter is set', async () => {
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1)]);
    vi.mocked(searchVehicles).mockResolvedValue([vehicle(2, 'Honda')]);

    const { result } = renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.applyFilters({ make: 'Toy' });
    });

    expect(searchVehicles).toHaveBeenCalledWith({ make: 'Toy' });
    expect(result.current.vehicles).toEqual([vehicle(2, 'Honda')]);
  });

  it('uses the list endpoint when filters are empty', async () => {
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1)]);

    const { result } = renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(getVehicles).mockResolvedValue([vehicle(1), vehicle(2)]);
    await act(async () => {
      await result.current.applyFilters({});
    });

    expect(searchVehicles).not.toHaveBeenCalled();
    expect(getVehicles).toHaveBeenCalledTimes(2);
  });

  it('ignores stale responses when a newer request resolves first', async () => {
    let resolveFirst!: (vehicles: Vehicle[]) => void;
    let resolveSecond!: (vehicles: Vehicle[]) => void;
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1)]);

    const { result } = renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(searchVehicles)
      .mockReturnValueOnce(
        new Promise<Vehicle[]>((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise<Vehicle[]>((resolve) => {
          resolveSecond = resolve;
        }),
      );

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.applyFilters({ make: 'A' });
    });
    act(() => {
      second = result.current.applyFilters({ make: 'B' });
    });

    // The newer request resolves first.
    await act(async () => {
      resolveSecond([vehicle(2)]);
      await second;
    });
    // The stale request resolves later and must be ignored.
    await act(async () => {
      resolveFirst([vehicle(3)]);
      await first;
    });

    expect(result.current.vehicles).toEqual([vehicle(2)]);
  });

  it('exposes an error when the initial load fails', async () => {
    vi.mocked(getVehicles).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVehicles());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.vehicles).toEqual([]);
  });

  it('refresh re-fetches with the current filters', async () => {
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1)]);

    const { result } = renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(getVehicles).toHaveBeenCalledTimes(2);
  });

  it('replaceVehicle swaps the matching vehicle by id', async () => {
    const list = [vehicle(1), vehicle(2)];
    vi.mocked(getVehicles).mockResolvedValue(list);

    const { result } = renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = { ...vehicle(1), quantity: 0 };
    act(() => {
      result.current.replaceVehicle(updated);
    });

    expect(result.current.vehicles).toEqual([updated, vehicle(2)]);
  });
});
