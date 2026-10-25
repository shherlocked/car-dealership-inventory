import { useState, type FormEvent } from 'react';
import type { CreateVehicleInput, UpdateVehicleInput } from '../api/client';
import type { Vehicle } from '../types';
import Modal from './Modal';
import Spinner from './Spinner';

interface VehicleFormModalProps {
  mode: 'add' | 'edit';
  initialVehicle: Vehicle | null;
  categories: string[];
  onSubmit: (data: CreateVehicleInput | UpdateVehicleInput) => Promise<void>;
  onClose: () => void;
}

interface FieldErrors {
  make?: string;
  model?: string;
  category?: string;
  price?: string;
  quantity?: string;
}

const EMPTY_FIELDS: FieldErrors = {};

/** Parses an integer quantity input, treating an empty string as 0. */
function parseQuantity(value: string): number {
  if (value.trim() === '') return 0;
  return Number(value);
}

/** Validates the form values against the backend contract. */
function validate(values: {
  make: string;
  model: string;
  category: string;
  price: string;
  quantity: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (values.make.trim() === '') errors.make = 'Make is required';
  if (values.model.trim() === '') errors.model = 'Model is required';
  if (values.category.trim() === '') errors.category = 'Category is required';

  const price = Number(values.price);
  if (values.price.trim() === '' || Number.isNaN(price) || price <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  const quantity = parseQuantity(values.quantity);
  if (values.quantity.trim() !== '') {
    if (!Number.isInteger(quantity)) {
      errors.quantity = 'Quantity must be an integer';
    } else if (quantity < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }
  }

  return errors;
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500';

/**
 * Add/edit form for a vehicle, rendered inside an accessible modal.
 * Validates client-side, shows inline errors and the server error, and in
 * edit mode submits only the fields that changed from the initial vehicle.
 */
export default function VehicleFormModal({
  mode,
  initialVehicle,
  categories,
  onSubmit,
  onClose,
}: VehicleFormModalProps) {
  const [make, setMake] = useState(initialVehicle?.make ?? '');
  const [model, setModel] = useState(initialVehicle?.model ?? '');
  const [category, setCategory] = useState(initialVehicle?.category ?? '');
  const [price, setPrice] = useState(initialVehicle ? String(initialVehicle.price) : '');
  const [quantity, setQuantity] = useState(
    initialVehicle ? String(initialVehicle.quantity) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_FIELDS);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = mode === 'edit';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);

    const values = { make, model, category, price, quantity };
    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: CreateVehicleInput | UpdateVehicleInput = isEdit
      ? buildChanges(values, initialVehicle!)
      : {
          make: make.trim(),
          model: model.trim(),
          category: category.trim(),
          price: Number(price),
          quantity: parseQuantity(quantity),
        };

    setLoading(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit vehicle' : 'Add vehicle'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="vehicle-make" className="block text-sm font-medium text-slate-300">
            Make
          </label>
          <input
            id="vehicle-make"
            type="text"
            value={make}
            onChange={(event) => setMake(event.target.value)}
            className={inputClass}
          />
          {fieldErrors.make && <p className="mt-1.5 text-sm text-danger">{fieldErrors.make}</p>}
        </div>

        <div>
          <label htmlFor="vehicle-model" className="block text-sm font-medium text-slate-300">
            Model
          </label>
          <input
            id="vehicle-model"
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className={inputClass}
          />
          {fieldErrors.model && <p className="mt-1.5 text-sm text-danger">{fieldErrors.model}</p>}
        </div>

        <div>
          <label htmlFor="vehicle-category" className="block text-sm font-medium text-slate-300">
            Category
          </label>
          <input
            id="vehicle-category"
            type="text"
            list="vehicle-categories"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          />
          <datalist id="vehicle-categories">
            {categories.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          {fieldErrors.category && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.category}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vehicle-price" className="block text-sm font-medium text-slate-300">
              Price
            </label>
            <input
              id="vehicle-price"
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={inputClass}
            />
            {fieldErrors.price && <p className="mt-1.5 text-sm text-danger">{fieldErrors.price}</p>}
          </div>

          <div>
            <label htmlFor="vehicle-quantity" className="block text-sm font-medium text-slate-300">
              Quantity
            </label>
            <input
              id="vehicle-quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={inputClass}
            />
            {fieldErrors.quantity && (
              <p className="mt-1.5 text-sm text-danger">{fieldErrors.quantity}</p>
            )}
          </div>
        </div>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner />}
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Computes the subset of fields that differ from the initial vehicle. */
function buildChanges(
  values: { make: string; model: string; category: string; price: string; quantity: string },
  initial: Vehicle,
): UpdateVehicleInput {
  const changes: UpdateVehicleInput = {};

  const make = values.make.trim();
  const model = values.model.trim();
  const category = values.category.trim();
  const price = Number(values.price);
  const quantity = parseQuantity(values.quantity);

  if (make !== initial.make) changes.make = make;
  if (model !== initial.model) changes.model = model;
  if (category !== initial.category) changes.category = category;
  if (price !== initial.price) changes.price = price;
  if (quantity !== initial.quantity) changes.quantity = quantity;

  return changes;
}
