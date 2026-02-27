import { and, eq, ne, sql } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { locationTags, skus, assets, components } from '../../../database/schema/index.js';

export type LocationTagEntity = typeof locationTags.$inferSelect;
export type CreateLocationTagDto = Omit<LocationTagEntity, 'id' | 'createdAt'>;
export type UpdateLocationTagDto = Partial<Omit<CreateLocationTagDto, 'organizationId'>>;

export class LocationTagsRepository {
  async findAllByUnit(unitId: string, organizationId: string): Promise<LocationTagEntity[]> {
    return db
      .select()
      .from(locationTags)
      .where(and(eq(locationTags.unitId, unitId), eq(locationTags.organizationId, organizationId)));
  }

  async findById(id: string, organizationId: string): Promise<LocationTagEntity | null> {
    const result = await db
      .select()
      .from(locationTags)
      .where(and(eq(locationTags.id, id), eq(locationTags.organizationId, organizationId)))
      .limit(1);

    return result[0] ?? null;
  }

  async create(payload: CreateLocationTagDto): Promise<LocationTagEntity> {
    const [created] = await db.insert(locationTags).values(payload).returning();
    return created;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateLocationTagDto,
  ): Promise<LocationTagEntity | null> {
    const [updated] = await db
      .update(locationTags)
      .set(data)
      .where(and(eq(locationTags.id, id), eq(locationTags.organizationId, organizationId)))
      .returning();

    return updated ?? null;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const [removed] = await db
      .delete(locationTags)
      .where(and(eq(locationTags.id, id), eq(locationTags.organizationId, organizationId)))
      .returning({ id: locationTags.id });

    return Boolean(removed);
  }

  async getUsage(locationTagId: string, organizationId: string, excludeSkuId?: string) {
    let conditions = and(
      eq(skus.locationTagId, locationTagId),
      eq(skus.organizationId, organizationId),
    );

    if (excludeSkuId) {
      conditions = and(conditions, ne(skus.id, excludeSkuId));
    }

    const result = await db
      .select({
        totalItems: sql<number>`COALESCE(SUM(${skus.quantity}), 0)`,
      })
      .from(skus)
      .where(conditions);

    return Number(result[0]?.totalItems ?? 0);
  }

  async findByNameWithinUnit(
    organizationId: string,
    unitId: string,
    locationTagName: string,
    excludeId?: string,
  ): Promise<LocationTagEntity | null> {
    let whereClause = and(
      eq(locationTags.organizationId, organizationId),
      eq(locationTags.unitId, unitId),
      eq(locationTags.locationTagName, locationTagName),
    );

    if (excludeId) {
      whereClause = and(whereClause, ne(locationTags.id, excludeId));
    }

    const result = await db.select().from(locationTags).where(whereClause).limit(1);
    return result[0] ?? null;
  }

  async getAssetCount(locationTagId: string, organizationId: string): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(assets)
      .where(
        and(
          eq(assets.locationTagId, locationTagId),
          eq(assets.organizationId, organizationId)
        )
      );

    return Number(result[0]?.count ?? 0);
  }

  async getComponentCount(locationTagId: string, organizationId: string): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(components)
      .where(
        and(
          eq(components.locationTagId, locationTagId),
          eq(components.organizationId, organizationId)
        )
      );

    return Number(result[0]?.count ?? 0);
  }

  async checkDependencies(locationTagId: string, organizationId: string): Promise<{
    skuCount: number;
    assetCount: number;
    componentCount: number;
    hasMovements: boolean;
  }> {
    const skuCount = await this.getUsage(locationTagId, organizationId);
    const assetCount = await this.getAssetCount(locationTagId, organizationId);
    const componentCount = await this.getComponentCount(locationTagId, organizationId);
    
    // Check for movements - we'll just check if any exist
    // This is a simple check; a more thorough one would query sku_movements table
    const hasMovements = false; // Simplified for now

    return {
      skuCount,
      assetCount,
      componentCount,
      hasMovements,
    };
  }

  async unassignFromSKUs(locationTagId: string, organizationId: string): Promise<number> {
    const result = await db
      .update(skus)
      .set({ locationTagId: null })
      .where(
        and(
          eq(skus.locationTagId, locationTagId),
          eq(skus.organizationId, organizationId)
        )
      )
      .returning({ id: skus.id });
    
    return result.length;
  }

  async unassignFromAssets(locationTagId: string, organizationId: string): Promise<number> {
    const result = await db
      .update(assets)
      .set({ locationTagId: null })
      .where(
        and(
          eq(assets.locationTagId, locationTagId),
          eq(assets.organizationId, organizationId)
        )
      )
      .returning({ id: assets.id });
    
    return result.length;
  }

  async unassignFromComponents(locationTagId: string, organizationId: string): Promise<number> {
    const result = await db
      .update(components)
      .set({ locationTagId: null })
      .where(
        and(
          eq(components.locationTagId, locationTagId),
          eq(components.organizationId, organizationId)
        )
      )
      .returning({ id: components.id });
    
    return result.length;
  }
}
