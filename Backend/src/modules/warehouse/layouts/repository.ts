import { and, eq } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { layouts } from '../../../database/schema/index.js';

export type LayoutEntity = typeof layouts.$inferSelect;
export type CreateLayoutDto = Omit<LayoutEntity, 'id' | 'createdAt'>;
export type UpdateLayoutDto = Partial<Pick<LayoutEntity, 'layoutName'>>;

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
}
