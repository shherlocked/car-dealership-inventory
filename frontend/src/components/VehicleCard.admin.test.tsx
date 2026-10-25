import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import { useAuth } from '../context/AuthContext';
import VehicleCard from './VehicleCard';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../api/client', () => ({
  purchaseVehicle: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const vehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 1,
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 25000,
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

describe('VehicleCard admin controls', () => {
  const onPurchased = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReset();
    onPurchased.mockReset();
    onError.mockReset();
  });

  function renderCard(value: Vehicle) {
    return render(
      <VehicleCard vehicle={value} onPurchased={onPurchased} onError={onError} />,
    );
  }

  it('renders Edit, Restock and Delete buttons for an admin', () => {
    setAuth(true);
    renderCard(vehicle());

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restock/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not render any admin controls for a regular user', () => {
    setAuth(false);
    renderCard(vehicle());

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
