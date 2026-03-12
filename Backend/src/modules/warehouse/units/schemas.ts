import { z } from 'zod';

const unitStatusEnum = z.enum(['LIVE', 'OFFLINE', 'MAINTENANCE', 'PLANNING']);
const unitIdRegex = /^[a-zA-Z0-9_-]+$/;
const areaRegex = /^\d+(?:\.\d+)?(?:\s*(?:sq|square)\s*[a-zA-Z]*\d*|\s*[a-zA-Z]+\d*)?$/i;

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
    .regex(areaRegex, 'Area must be a number, optionally followed by units (e.g., 200, 200 sqm, 500 square feet, 1000m²)')
    .optional()
    .nullable(),
});

export const updateUnitSchema = createUnitSchema.partial();

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
