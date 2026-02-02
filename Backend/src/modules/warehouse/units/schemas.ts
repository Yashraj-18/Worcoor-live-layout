import { z } from 'zod';

const unitStatusEnum = z.enum(['LIVE', 'OFFLINE', 'MAINTENANCE', 'PLANNING']);
const unitIdRegex = /^[a-zA-Z0-9_-]+$/;
const areaRegex = /^\d+(?:\.\d+)?\s+sq\s+[A-Za-z]+$/i;

export const createUnitSchema = z.object({
  unitId: z
    .string({ required_error: 'Unit ID is required' })
    .min(1, 'Unit ID is required')
    .max(100, 'Unit ID must be less than 100 characters')
    .regex(unitIdRegex, 'Unit ID can only contain letters, numbers, hyphens, and underscores'),
  unitName: z.string().min(1).max(255),
  unitType: z.string().min(1).max(100),
  status: unitStatusEnum,
  description: z.string().max(1000).optional().nullable(),
  area: z
    .string()
    .max(100, 'Area must be less than 100 characters')
    .regex(areaRegex, 'Area must be in format: [number] sq [unit] (e.g., 200 sq meters)')
    .optional()
    .nullable(),
});

export const updateUnitSchema = createUnitSchema.partial();

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
