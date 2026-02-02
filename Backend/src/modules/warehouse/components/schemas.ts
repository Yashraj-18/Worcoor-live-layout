import { z } from 'zod';

export const createComponentSchema = z.object({
  componentType: z.string().min(1).max(100),
  displayName: z.string().min(1).max(255),
  positionX: z.number().int(),
  positionY: z.number().int(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  color: z.string().max(50).optional().nullable(),
  locationTagId: z.string().uuid().optional().nullable(),
});

export const updateComponentSchema = createComponentSchema.partial();

export const updateLocationTagSchema = z.object({
  locationTagId: z.string().uuid().nullable(),
});

export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;
export type UpdateLocationTagInput = z.infer<typeof updateLocationTagSchema>;
