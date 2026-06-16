import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const objectIdArraySchema = z
  .array(objectIdSchema)
  .min(1, 'At least one ID is required');
