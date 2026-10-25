import { useMemo, useState } from 'react';
import { Car, Layers, Plus, PackageCheck } from 'lucide-react';
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
import { useToast } from '../context/ToastContext';
import { useVehicles } from '../hooks/useVehicles';
import type { Vehicle } from '../types';

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; vehicle: Vehicle }
  | { type: 'delete'; vehicle: Vehicle }
  | { type: 'restock'; vehicle: Vehicle }
  | null;

/**
 * Inventory dashboard: hero banner with stats strip, sticky filters and the
 * vehicle grid. Admins can add, edit, restock and delete through modals.
 * Success feedback is delivered through toasts.
 */
export default function DashboardPage() {
  const { vehicles, loading, error, applyFilters, refresh, replaceVehicle } = useVehicles();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [modal, setModal] = useState<ModalState>(null);

  const categories = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.category))).sort(),
    [vehicles],
  );

  const inStock = useMemo(
    () => vehicles.filter((vehicle) => vehicle.quantity > 0).length,
    [vehicles],
  );

  function clearFilters() {
    void applyFilters({});
  }

  async function handleAdd(data: CreateVehicleInput | UpdateVehicleInput) {
    await createVehicle(data as CreateVehicleInput);
    setModal(null);
    toast(`${data.make} ${data.model} added`);
    await refresh();
  }

  async function handleEdit(vehicle: Vehicle, data: CreateVehicleInput | UpdateVehicleInput) {
    const updated = await updateVehicle(vehicle.id, data as UpdateVehicleInput);
    replaceVehicle(updated);
    setModal(null);
    toast(`${updated.make} ${updated.model} updated`);
  }

  async function handleDelete(vehicle: Vehicle) {
    await deleteVehicle(vehicle.id);
    setModal(null);
    toast(`${vehicle.make} ${vehicle.model} deleted`);
    await refresh();
  }

  async function handleRestock(vehicle: Vehicle, quantity: number) {
    const updated = await restockVehicle(vehicle.id, quantity);
    replaceVehicle(updated);
    setModal(null);
    toast(`${updated.make} ${updated.model} restocked`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-xl2 border border-line bg-gradient-to-br from-surface-raised via-surface to-canvas p-6 shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">
              The showroom floor
            </h1>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              Every vehicle in inventory, ready to browse, filter and manage.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setModal({ type: 'add' })}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add vehicle
            </button>
          )}
        </div>

        {/* Stats strip */}
        <dl className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat icon={<Car className="h-5 w-5 text-accent-400" aria-hidden="true" />} label="Total vehicles" value={String(vehicles.length)} />
          <Stat icon={<PackageCheck className="h-5 w-5 text-ok" aria-hidden="true" />} label="In stock" value={String(inStock)} />
          <Stat icon={<Layers className="h-5 w-5 text-warn" aria-hidden="true" />} label="Categories" value={String(categories.length)} />
        </dl>
      </section>

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

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 px-4 py-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-200">
        {icon}
      </span>
      <div>
        <dd className="tabular-nums font-display text-xl font-bold text-white">{value}</dd>
        <dt className="text-xs text-slate-400">{label}</dt>
      </div>
    </div>
  );
}
