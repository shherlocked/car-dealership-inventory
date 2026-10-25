import { useMemo, useState } from 'react';
import {
  createVehicle,
  deleteVehicle,
  restockVehicle,
  updateVehicle,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from '../api/client';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import RestockModal from '../components/RestockModal';
import VehicleFilters from '../components/VehicleFilters';
import VehicleFormModal from '../components/VehicleFormModal';
import VehicleGrid from '../components/VehicleGrid';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../hooks/useVehicles';
import type { Vehicle } from '../types';

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; vehicle: Vehicle }
  | { type: 'delete'; vehicle: Vehicle }
  | { type: 'restock'; vehicle: Vehicle }
  | null;

/**
 * Inventory dashboard: header with result count, filters and the vehicle grid.
 * Admins can add, edit, restock and delete vehicles through modals.
 */
export default function DashboardPage() {
  const { vehicles, loading, error, applyFilters, refresh, replaceVehicle } = useVehicles();
  const { isAdmin } = useAuth();
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.category))).sort(),
    [vehicles],
  );

  function clearFilters() {
    void applyFilters({});
  }

  function notify(message: string) {
    setConfirmation(message);
  }

  async function handleAdd(data: CreateVehicleInput | UpdateVehicleInput) {
    await createVehicle(data as CreateVehicleInput);
    setModal(null);
    notify(`${data.make} ${data.model} added`);
    await refresh();
  }

  async function handleEdit(vehicle: Vehicle, data: CreateVehicleInput | UpdateVehicleInput) {
    const updated = await updateVehicle(vehicle.id, data as UpdateVehicleInput);
    replaceVehicle(updated);
    setModal(null);
    notify(`${updated.make} ${updated.model} updated`);
  }

  async function handleDelete(vehicle: Vehicle) {
    await deleteVehicle(vehicle.id);
    setModal(null);
    notify(`${vehicle.make} ${vehicle.model} deleted`);
    await refresh();
  }

  async function handleRestock(vehicle: Vehicle, quantity: number) {
    const updated = await restockVehicle(vehicle.id, quantity);
    replaceVehicle(updated);
    setModal(null);
    notify(`${updated.make} ${updated.model} restocked`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Available vehicles</h1>
          <p className="text-sm text-slate-500">
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setModal({ type: 'add' })}
            className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          >
            Add vehicle
          </button>
        )}
      </header>

      <div aria-live="polite" className="mt-2 min-h-[1.25rem]">
        {confirmation && <p className="text-sm text-emerald-700">{confirmation}</p>}
      </div>

      <div className="mt-4">
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
          onEdit={isAdmin ? (vehicle) => setModal({ type: 'edit', vehicle }) : undefined}
          onDelete={isAdmin ? (vehicle) => setModal({ type: 'delete', vehicle }) : undefined}
          onRestock={isAdmin ? (vehicle) => setModal({ type: 'restock', vehicle }) : undefined}
        />
      </div>

      {modal?.type === 'add' && (
        <VehicleFormModal
          mode="add"
          initialVehicle={null}
          categories={categories}
          onSubmit={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'edit' && (
        <VehicleFormModal
          mode="edit"
          initialVehicle={modal.vehicle}
          categories={categories}
          onSubmit={(data) => handleEdit(modal.vehicle, data)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'delete' && (
        <ConfirmDeleteModal
          vehicleName={`${modal.vehicle.make} ${modal.vehicle.model}`}
          onConfirm={() => handleDelete(modal.vehicle)}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === 'restock' && (
        <RestockModal
          vehicleName={`${modal.vehicle.make} ${modal.vehicle.model}`}
          currentStock={modal.vehicle.quantity}
          onSubmit={(quantity) => handleRestock(modal.vehicle, quantity)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
