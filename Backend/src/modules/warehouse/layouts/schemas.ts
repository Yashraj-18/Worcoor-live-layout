import { z } from 'zod';

export const createLayoutSchema = z.object({
  layoutName: z.string().min(1).max(255),
});

export const updateLayoutSchema = createLayoutSchema.partial();

export type CreateLayoutInput = z.infer<typeof createLayoutSchema>;
export type UpdateLayoutInput = z.infer<typeof updateLayoutSchema>;
