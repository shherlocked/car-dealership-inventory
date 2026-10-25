import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VehicleFilters from './VehicleFilters';

describe('VehicleFilters', () => {
  const onApply = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    onApply.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces text input by 300ms', () => {
    render(<VehicleFilters categories={[]} onApply={onApply} />);

    fireEvent.change(screen.getByLabelText(/make/i), { target: { value: 'Toy' } });
    expect(onApply).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onApply).toHaveBeenCalledWith({ make: 'Toy' });
  });

  it('blocks applying filters when minPrice is greater than maxPrice', () => {
    render(<VehicleFilters categories={[]} onApply={onApply} />);

    fireEvent.change(screen.getByLabelText(/min price/i), { target: { value: '30000' } });
    fireEvent.change(screen.getByLabelText(/max price/i), { target: { value: '10000' } });

    expect(screen.getByText(/min price.*greater/i)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 30000, maxPrice: 10000 }),
    );
  });

  it('clear resets the inputs and applies empty filters', () => {
    render(<VehicleFilters categories={[]} onApply={onApply} />);

    fireEvent.change(screen.getByLabelText(/make/i), { target: { value: 'Toy' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByLabelText(/make/i)).toHaveValue('');
    expect(onApply).toHaveBeenLastCalledWith({});
  });

  it('derives category options from the provided categories', () => {
    render(<VehicleFilters categories={['Sedan', 'SUV']} onApply={onApply} />);

    expect(screen.getByRole('option', { name: 'Sedan' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'SUV' })).toBeInTheDocument();
  });
});
