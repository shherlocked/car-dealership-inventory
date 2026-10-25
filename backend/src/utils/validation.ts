import { z } from 'zod';

const email = z.string().trim().email('A valid email address is required');
const password = z.string().min(8, 'Password must be at least 8 characters long');

/** Schema for the registration payload. */
export const registerSchema = z.object({ email, password });

/** Schema for the login payload. */
export const loginSchema = z.object({ email, password });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
