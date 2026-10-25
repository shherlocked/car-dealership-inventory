import { describe, expectTypeOf, it } from 'vitest';
import type { User, Vehicle } from './types';

describe('types', () => {
  it('defines a User with id, email and role', () => {
    expectTypeOf<User>().toEqualTypeOf<{
      id: number;
      email: string;
      role: 'USER' | 'ADMIN';
    }>();
  });

  it('defines a Vehicle with id, make, model, category, price and quantity', () => {
    expectTypeOf<Vehicle>().toEqualTypeOf<{
      id: number;
      make: string;
      model: string;
      category: string;
      price: number;
      quantity: number;
    }>();
  });
});
