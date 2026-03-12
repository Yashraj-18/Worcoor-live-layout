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
 
export const syncLayoutSchema = z.object({
  components: z.array(
    z.object({
      id: z.string().uuid().optional(),
      componentType: z.string().min(1).max(100),
      displayName: z.string().min(1).max(255),
      positionX: z.number().int(),
      positionY: z.number().int(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      color: z.string().max(50).optional().nullable(),
      locationTagId: z.string().uuid().optional().nullable(),
      label: z.string().max(255).optional().nullable(),
      metadata: z.record(z.unknown()).optional().nullable(),
    })
  ),
  deleteIds: z.array(z.string().uuid()).optional(),
});
 
export type CreateLayoutInput = z.infer<typeof createLayoutSchema>;
export type UpdateLayoutInput = z.infer<typeof updateLayoutSchema>;
export type SyncLayoutInput = z.infer<typeof syncLayoutSchema>;
