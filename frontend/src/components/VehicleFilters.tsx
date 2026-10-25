import { useEffect, useRef, useState } from 'react';
import type { VehicleFilters as FilterValues } from '../types';

interface VehicleFiltersProps {
  categories: string[];
  onApply: (filters: FilterValues) => void;
}

const EMPTY_FILTERS: FilterValues = {};

/** Reads a numeric price input, returning undefined for blank or NaN values. */
function toNumber(value: string): number | undefined {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Inventory filter controls. Text inputs are debounced by 300ms; price inputs
 * apply immediately, but block (with an inline message) when min > max.
 */
export default function VehicleFilters({ categories, onApply }: VehicleFiltersProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyFilters(next: FilterValues) {
    onApply(next);
  }

  function clear() {
    setMake('');
    setModel('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setPriceError(null);
    applyFilters(EMPTY_FILTERS);
  }

  function applyPriceFilters(nextMin: string, nextMax: string) {
    const min = toNumber(nextMin);
    const max = toNumber(nextMax);
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError('Min price must not be greater than max price');
      return;
    }
    setPriceError(null);
    applyFilters({
      make: make || undefined,
      model: model || undefined,
      category: category || undefined,
      minPrice: min,
      maxPrice: max,
    });
  }

  // Debounce text inputs so a request is only fired after typing stops.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyFilters({
        make: make || undefined,
        model: model || undefined,
        category: category || undefined,
        minPrice: toNumber(minPrice),
        maxPrice: toNumber(maxPrice),
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [make, model, category]);

  const inputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="make" className="block text-sm font-medium text-slate-700">
            Make
          </label>
          <input
            id="make"
            type="text"
            value={make}
            onChange={(event) => setMake(event.target.value)}
            placeholder="e.g. Toyota"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-slate-700">
            Model
          </label>
          <input
            id="model"
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="e.g. Corolla"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">All categories</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium text-slate-700">
            Min price
          </label>
          <input
            id="minPrice"
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => {
              const next = event.target.value;
              setMinPrice(next);
              applyPriceFilters(next, maxPrice);
            }}
            placeholder="0"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-slate-700">
            Max price
          </label>
          <input
            id="maxPrice"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => {
              const next = event.target.value;
              setMaxPrice(next);
              applyPriceFilters(minPrice, next);
            }}
            placeholder="Any"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {priceError && <p className="text-sm text-red-600">{priceError}</p>}
        <button
          type="button"
          onClick={clear}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
