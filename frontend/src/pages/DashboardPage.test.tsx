import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import { getVehicles, searchVehicles } from '../api/client';
import DashboardPage from './DashboardPage';

vi.mock('../api/client', () => ({
  getVehicles: vi.fn(),
  searchVehicles: vi.fn(),
  purchaseVehicle: vi.fn(),
}));

const vehicle = (id: number): Vehicle => ({
  id,
  make: 'Toyota',
  model: `Model ${id}`,
  category: 'Sedan',
  price: 20000 + id,
  quantity: 2,
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getVehicles).mockReset();
    vi.mocked(searchVehicles).mockReset();
  });

  it('renders vehicles with a result count', async () => {
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1), vehicle(2)]);

    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: 'Available vehicles' })).toBeInTheDocument();
    expect(await screen.findByText('Toyota Model 1')).toBeInTheDocument();
    expect(screen.getByText('Toyota Model 2')).toBeInTheDocument();
    expect(screen.getByText('2 vehicles')).toBeInTheDocument();
  });

  it('shows the empty state with a clear filters action', async () => {
    vi.mocked(getVehicles).mockResolvedValue([]);

    render(<DashboardPage />);

    expect(await screen.findByText('No vehicles match your filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('shows an error state with a retry that reloads', async () => {
    vi.mocked(getVehicles)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([vehicle(1)]);

    render(<DashboardPage />);

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Toyota Model 1')).toBeInTheDocument();
  });

  it('calls the search endpoint when filters are applied', async () => {
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1), vehicle(2)]);
    vi.mocked(searchVehicles).mockResolvedValue([vehicle(1)]);

    render(<DashboardPage />);
    await screen.findByText('Toyota Model 1');

    await userEvent.type(screen.getByLabelText(/make/i), 'Toy');

    await waitFor(() => expect(searchVehicles).toHaveBeenCalledWith({ make: 'Toy' }));
  });
});
