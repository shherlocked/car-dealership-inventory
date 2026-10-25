import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import VehicleFormModal from './VehicleFormModal';

const initial = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 1,
  make: 'Toyota',
  model: 'Corolla',
  category: 'Sedan',
  price: 20000,
  quantity: 2,
  ...overrides,
});

describe('VehicleFormModal', () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
    onClose.mockReset();
  });

  function renderAdd() {
    return render(
      <VehicleFormModal
        mode="add"
        initialVehicle={null}
        categories={['Sedan', 'SUV']}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
  }

  function renderEdit(value: Vehicle) {
    return render(
      <VehicleFormModal
        mode="edit"
        initialVehicle={value}
        categories={['Sedan', 'SUV']}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
  }

  it('shows required-field errors when submitting an empty form', async () => {
    renderAdd();

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    expect(await screen.findByText(/make is required/i)).toBeInTheDocument();
    expect(screen.getByText(/model is required/i)).toBeInTheDocument();
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates price and quantity and blocks submission', async () => {
    renderAdd();

    await userEvent.type(screen.getByLabelText(/make/i), 'Toyota');
    await userEvent.type(screen.getByLabelText(/model/i), 'Corolla');
    await userEvent.type(screen.getByLabelText(/category/i), 'Sedan');
    await userEvent.type(screen.getByLabelText(/price/i), '-5');
    await userEvent.type(screen.getByLabelText(/quantity/i), '2.5');

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    expect(await screen.findByText(/price must be greater than 0/i)).toBeInTheDocument();
    expect(screen.getByText(/quantity must be an integer/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the full payload when adding', async () => {
    renderAdd();

    await userEvent.type(screen.getByLabelText(/make/i), 'Honda');
    await userEvent.type(screen.getByLabelText(/model/i), 'Civic');
    await userEvent.type(screen.getByLabelText(/category/i), 'Sedan');
    await userEvent.type(screen.getByLabelText(/price/i), '22000');
    await userEvent.type(screen.getByLabelText(/quantity/i), '3');

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        make: 'Honda',
        model: 'Civic',
        category: 'Sedan',
        price: 22000,
        quantity: 3,
      }),
    );
  });

  it('prefills values in edit mode and submits only changed fields', async () => {
    renderEdit(initial());

    await userEvent.clear(screen.getByLabelText(/price/i));
    await userEvent.type(screen.getByLabelText(/price/i), '21000');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ price: 21000 }));
  });

  it('shows the server error inside the modal', async () => {
    onSubmit.mockRejectedValue(new Error('Database is down'));

    renderAdd();
    await userEvent.type(screen.getByLabelText(/make/i), 'Honda');
    await userEvent.type(screen.getByLabelText(/model/i), 'Civic');
    await userEvent.type(screen.getByLabelText(/category/i), 'Sedan');
    await userEvent.type(screen.getByLabelText(/price/i), '22000');
    await userEvent.type(screen.getByLabelText(/quantity/i), '3');

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));

    expect(await screen.findByText('Database is down')).toBeInTheDocument();
  });
});
