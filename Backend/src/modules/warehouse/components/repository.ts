import { and, eq } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { components } from '../../../database/schema/index.js';

export type ComponentEntity = typeof components.$inferSelect;
export type CreateComponentDto = Omit<ComponentEntity, 'id' | 'createdAt'>;
export type UpdateComponentDto = Partial<Omit<CreateComponentDto, 'layoutId' | 'organizationId'>>;

export class ComponentsRepository {
  async findById(id: string, organizationId: string): Promise<ComponentEntity | null> {
    const result = await db
      .select()
      .from(components)
      .where(and(eq(components.id, id), eq(components.organizationId, organizationId)))
      .limit(1);

    return result[0] ?? null;
  }

  async create(payload: CreateComponentDto): Promise<ComponentEntity> {
    const [created] = await db.insert(components).values(payload).returning();
    return created;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateComponentDto,
  ): Promise<ComponentEntity | null> {
    const [updated] = await db
      .update(components)
      .set(data)
      .where(and(eq(components.id, id), eq(components.organizationId, organizationId)))
      .returning();

    return updated ?? null;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const deleted = await db
      .delete(components)
      .where(and(eq(components.id, id), eq(components.organizationId, organizationId)))
      .returning({ id: components.id });

    return deleted.length > 0;
  }
}
