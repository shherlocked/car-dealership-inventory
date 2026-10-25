import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import { purchaseVehicle } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VehicleCard from './VehicleCard';

vi.mock('../api/client', () => ({
  purchaseVehicle: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const vehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 1,
  make: 'Toyota',
  model: 'Corolla',
  category: 'Sedan',
  price: 20000,
  quantity: 2,
  ...overrides,
});

describe('VehicleCard', () => {
  const onPurchased = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.mocked(purchaseVehicle).mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'user@example.com', role: 'USER' },
      token: 'jwt',
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    onPurchased.mockReset();
    onError.mockReset();
  });

  function renderCard(value: Vehicle = vehicle()) {
    return render(<VehicleCard vehicle={value} onPurchased={onPurchased} onError={onError} />);
  }

  it('disables the Purchase button when quantity is 0', () => {
    renderCard(vehicle({ quantity: 0 }));

    expect(screen.getByRole('button', { name: /purchase toyota corolla/i })).toBeDisabled();
  });

  it('shows low-stock text for quantities 1 through 3', () => {
    renderCard(vehicle({ quantity: 1 }));

    expect(screen.getByText('Only 1 left')).toBeInTheDocument();
  });

  it('shows "N in stock" for quantities above 3', () => {
    renderCard(vehicle({ quantity: 4 }));

    expect(screen.getByText('4 in stock')).toBeInTheDocument();
  });

  it('updates the card after a successful purchase', async () => {
    const updated = vehicle({ quantity: 1 });
    vi.mocked(purchaseVehicle).mockResolvedValue(updated);

    renderCard(vehicle({ quantity: 2 }));
    await userEvent.click(screen.getByRole('button', { name: /purchase toyota corolla/i }));

    await waitFor(() => expect(onPurchased).toHaveBeenCalledWith(updated));
    expect(screen.getByText('Only 1 left')).toBeInTheDocument();
    expect(purchaseVehicle).toHaveBeenCalledWith(1);
  });

  it('shows a loading state while the purchase request runs', async () => {
    let resolvePurchase!: (value: Vehicle) => void;
    vi.mocked(purchaseVehicle).mockReturnValue(
      new Promise<Vehicle>((resolve) => {
        resolvePurchase = resolve;
      }),
    );

    renderCard(vehicle({ quantity: 2 }));
    const button = screen.getByRole('button', { name: /purchase toyota corolla/i });
    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());

    await act(async () => {
      resolvePurchase(vehicle({ quantity: 1 }));
    });
  });

  it('shows the error message and refreshes on a 409', async () => {
    vi.mocked(purchaseVehicle).mockRejectedValue(new Error('Out of stock'));

    renderCard(vehicle({ quantity: 2 }));
    await userEvent.click(screen.getByRole('button', { name: /purchase toyota corolla/i }));

    expect(await screen.findByText('Out of stock')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledOnce();
    expect(onPurchased).not.toHaveBeenCalled();
  });
});
