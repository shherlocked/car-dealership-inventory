import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  restockVehicle,
  searchVehicles,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';

vi.mock('../api/client', () => ({
  getVehicles: vi.fn(),
  searchVehicles: vi.fn(),
  purchaseVehicle: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  restockVehicle: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const vehicle = (id: number, overrides: Partial<Vehicle> = {}): Vehicle => ({
  id,
  make: 'Toyota',
  model: `Model ${id}`,
  category: 'Sedan',
  price: 20000 + id,
  quantity: 2,
  ...overrides,
});

function setAuth(isAdmin: boolean) {
  mockUseAuth.mockReturnValue({
    user: { id: 1, email: 'a@example.com', role: isAdmin ? 'ADMIN' : 'USER' },
    token: 'jwt',
    isAdmin,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getVehicles).mockReset();
    vi.mocked(searchVehicles).mockReset();
    vi.mocked(createVehicle).mockReset();
    vi.mocked(deleteVehicle).mockReset();
    vi.mocked(restockVehicle).mockReset();
    setAuth(false);
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

  it('does not render the Add vehicle button or card admin controls for a USER', async () => {
    setAuth(false);
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1)]);

    render(<DashboardPage />);
    await screen.findByText('Toyota Model 1');

    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit toyota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restock toyota/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete toyota/i })).not.toBeInTheDocument();
  });

  it('adds a vehicle and shows an aria-live confirmation', async () => {
    setAuth(true);
    const created = vehicle(2, { make: 'Honda', model: 'Civic' });
    let inventory: Vehicle[] = [vehicle(1)];
    vi.mocked(getVehicles).mockImplementation(async () => inventory);
    vi.mocked(createVehicle).mockImplementation(async () => {
      inventory = [vehicle(1), created];
      return created;
    });

    render(<DashboardPage />);
    await screen.findByText('Toyota Model 1');

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/make/i), 'Honda');
    await userEvent.type(within(dialog).getByLabelText(/model/i), 'Civic');
    await userEvent.type(within(dialog).getByLabelText(/category/i), 'Sedan');
    await userEvent.type(within(dialog).getByLabelText(/price/i), '22000');
    await userEvent.type(within(dialog).getByLabelText(/quantity/i), '3');
    await userEvent.click(within(dialog).getByRole('button', { name: /add vehicle/i }));

    await waitFor(() =>
      expect(createVehicle).toHaveBeenCalledWith({
        make: 'Honda',
        model: 'Civic',
        category: 'Sedan',
        price: 22000,
        quantity: 3,
      }),
    );
    expect(await screen.findByText('Honda Civic')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic added')).toBeInTheDocument();
  });

  it('deletes a vehicle and removes its card', async () => {
    setAuth(true);
    let inventory: Vehicle[] = [vehicle(1)];
    vi.mocked(getVehicles).mockImplementation(async () => inventory);
    vi.mocked(deleteVehicle).mockImplementation(async () => {
      inventory = [];
    });

    render(<DashboardPage />);
    await screen.findByText('Toyota Model 1');

    await userEvent.click(screen.getByRole('button', { name: /delete toyota model 1/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteVehicle).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Toyota Model 1 deleted')).toBeInTheDocument();
    expect(screen.queryByText('Toyota Model 1')).not.toBeInTheDocument();
  });

  it('restocks a vehicle and updates its stock', async () => {
    setAuth(true);
    vi.mocked(getVehicles).mockResolvedValue([vehicle(1)]);
    const restocked = vehicle(1, { quantity: 6 });
    vi.mocked(restockVehicle).mockResolvedValue(restocked);

    render(<DashboardPage />);
    await screen.findByText('Toyota Model 1');

    await userEvent.click(screen.getByRole('button', { name: /restock toyota model 1/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/quantity/i), '4');
    await userEvent.click(within(dialog).getByRole('button', { name: /restock/i }));

    await waitFor(() => expect(restockVehicle).toHaveBeenCalledWith(1, 4));
    expect(await screen.findByText('6 in stock')).toBeInTheDocument();
    expect(screen.getByText('Toyota Model 1 restocked')).toBeInTheDocument();
  });
});
