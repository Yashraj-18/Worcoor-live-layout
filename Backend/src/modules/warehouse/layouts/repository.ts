import { and, eq, inArray } from 'drizzle-orm';
 
import { db } from '../../../config/database.js';
import { layouts, components } from '../../../database/schema/index.js';
 
export type LayoutEntity = typeof layouts.$inferSelect;
export type CreateLayoutDto = Omit<LayoutEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateLayoutDto = Partial<
  Pick<LayoutEntity, 'layoutName' | 'status' | 'layoutData' | 'metadata'>
> & { updatedAt?: LayoutEntity['updatedAt'] };
 
export class LayoutsRepository {
  async findAllByUnit(unitId: string, organizationId: string): Promise<LayoutEntity[]> {
    return db
      .select()
      .from(layouts)
      .where(and(eq(layouts.unitId, unitId), eq(layouts.organizationId, organizationId)));
  }
 
  async findById(id: string, organizationId: string): Promise<LayoutEntity | null> {
    const result = await db
      .select()
      .from(layouts)
      .where(and(eq(layouts.id, id), eq(layouts.organizationId, organizationId)))
      .limit(1);
 
    return result[0] ?? null;
  }
 
  async create(payload: CreateLayoutDto): Promise<LayoutEntity> {
    const [created] = await db.insert(layouts).values(payload).returning();
    return created;
  }
 
  async update(id: string, organizationId: string, data: UpdateLayoutDto): Promise<LayoutEntity | null> {
    const [updated] = await db
      .update(layouts)
      .set(data)
      .where(and(eq(layouts.id, id), eq(layouts.organizationId, organizationId)))
      .returning();
 
    return updated ?? null;
  }
 
  async delete(id: string, organizationId: string): Promise<boolean> {
    const deleted = await db
      .delete(layouts)
      .where(and(eq(layouts.id, id), eq(layouts.organizationId, organizationId)))
      .returning({ id: layouts.id });
 
    return deleted.length > 0;
  }
 
  async syncComponents(
    layoutId: string,
    organizationId: string,
    payload: { components: any[]; deleteIds?: string[] }
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Delete requested components
      if (payload.deleteIds?.length) {
        await tx
          .delete(components)
          .where(
            and(
              eq(components.layoutId, layoutId),
              eq(components.organizationId, organizationId),
              inArray(components.id, payload.deleteIds)
            )
          );
      }
 
      // 2. Upsert components
      for (const comp of payload.components) {
        if (comp.id) {
          // Update existing
          await tx
            .update(components)
            .set({
              ...comp,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(components.id, comp.id),
                eq(components.layoutId, layoutId),
                eq(components.organizationId, organizationId)
              )
            );
        } else {
          // Create new
          await tx.insert(components).values({
            ...comp,
            layoutId,
            organizationId,
          });
        }
      }
 
      // 3. Update layout timestamp
      await tx
        .update(layouts)
        .set({ updatedAt: new Date() })
        .where(and(eq(layouts.id, layoutId), eq(layouts.organizationId, organizationId)));
    });
  }
}
