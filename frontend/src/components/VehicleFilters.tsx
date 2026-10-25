import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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
 * Inventory filter controls rendered as a sticky bar. Category chips (All plus
 * each category) apply immediately; text inputs are debounced by 300ms; price
 * inputs apply immediately but block (with an inline message) when min > max.
 */
export default function VehicleFilters({ categories, onApply }: VehicleFiltersProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRenderRef = useRef(true);

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
    // Skip the initial mount so opening the dashboard doesn't trigger a
    // redundant, empty filter request; only debounce real user changes.
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
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
    'w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500';

  return (
    <div className="sticky top-16 z-30 rounded-xl2 border border-line bg-surface/90 shadow-card backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <SlidersHorizontal className="h-4 w-4 text-accent-400" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-200">Filters</span>
      </div>

      <div className="space-y-4 p-4">
        {/* Category chips */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-300">Category</legend>
          <div className="flex flex-wrap gap-2">
            <CategoryChip active={category === ''} onClick={() => setCategory('')} label="All" />
            {categories.map((option) => (
              <CategoryChip
                key={option}
                active={category === option}
                onClick={() => setCategory(option)}
                label={option}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-slate-300">
              Make
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="make"
                type="text"
                value={make}
                onChange={(event) => setMake(event.target.value)}
                placeholder="e.g. Toyota"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-slate-300">
              Model
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="model"
                type="text"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="e.g. Corolla"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-slate-300">
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
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-slate-300">
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
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {priceError && (
            <p className="text-sm text-danger" role="alert">
              {priceError}
            </p>
          )}
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-danger/50 hover:text-danger"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoryChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function CategoryChip({ label, active, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-accent-500 bg-accent-500/15 text-accent-300'
          : 'border-line bg-surface-raised text-slate-300 hover:border-accent-500/50 hover:text-slate-100'
      }`}
    >
      {label}
    </button>
  );
}
