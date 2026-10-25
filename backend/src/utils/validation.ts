import { z } from 'zod';

const email = z.string().trim().email('A valid email address is required');
const password = z.string().min(8, 'Password must be at least 8 characters long');

/** Schema for the registration payload. */
export const registerSchema = z.object({ email, password });

/** Schema for the login payload. */
export const loginSchema = z.object({ email, password });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Builds a required, trimmed, non-empty string schema for a named field. */
const requiredText = (field: string) => z.string().trim().min(1, `${field} is required`);

const price = z.number().positive('Price must be greater than 0');
const quantity = z
  .number()
  .int('Quantity must be an integer')
  .min(0, 'Quantity cannot be negative');

/** Schema for creating a vehicle. Quantity defaults to 0 when omitted. */
export const createVehicleSchema = z.object({
  make: requiredText('Make'),
  model: requiredText('Model'),
  category: requiredText('Category'),
  price,
  quantity: quantity.default(0),
});

/** Schema for a partial vehicle update; at least one field must be present. */
export const updateVehicleSchema = z
  .object({
    make: requiredText('Make').optional(),
    model: requiredText('Model').optional(),
    category: requiredText('Category').optional(),
    price: price.optional(),
    quantity: quantity.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** Schema for the vehicle search query string. Prices are coerced and must be numeric. */
export const searchVehiclesQuerySchema = z.object({
  make: requiredText('Make').optional(),
  model: requiredText('Model').optional(),
  category: requiredText('Category').optional(),
  minPrice: z.coerce.number({ message: 'minPrice must be a number' }).optional(),
  maxPrice: z.coerce.number({ message: 'maxPrice must be a number' }).optional(),
});

/** Schema for the restock payload; the amount must be a positive integer. */
export const restockVehicleSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0'),
});

/** Schema for a positive integer vehicle id route parameter. */
export const vehicleIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'Vehicle id must be a number' })
    .int('Vehicle id must be an integer')
    .positive('Vehicle id must be positive'),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type SearchVehiclesQuery = z.infer<typeof searchVehiclesQuerySchema>;
export type RestockVehicleInput = z.infer<typeof restockVehicleSchema>;
