import { z } from 'zod';

const layoutStatusSchema = z.enum(['operational', 'draft', 'archived']);
const jsonRecordSchema = z.record(z.any());

export const createLayoutSchema = z.object({
  layoutName: z.string().min(1).max(255),
  status: layoutStatusSchema.optional(),
  layoutData: jsonRecordSchema.optional(),
  metadata: jsonRecordSchema.optional(),
});

export const updateLayoutSchema = createLayoutSchema.partial();

export type CreateLayoutInput = z.infer<typeof createLayoutSchema>;
export type UpdateLayoutInput = z.infer<typeof updateLayoutSchema>;
