import { and, count, eq, ilike, ne } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { locationTags, skus } from '../../../database/schema/index.js';
import type { SkuQueryInput } from './schemas.js';

export type SkuEntity = typeof skus.$inferSelect;
export type CreateSkuDto = Omit<SkuEntity, 'id' | 'createdAt'>;
export type UpdateSkuDto = Partial<Omit<CreateSkuDto, 'organizationId'>>;

export class SkusRepository {
  private buildFilters(organizationId: string, query: SkuQueryInput) {
    const filters = [eq(skus.organizationId, organizationId)];

    if (query.search) {
      filters.push(ilike(skus.skuName, `%${query.search}%`));
    }

    if (query.locationTagId) {
      filters.push(eq(skus.locationTagId, query.locationTagId));
    }

    return filters;
  }

  async list(organizationId: string, query: SkuQueryInput) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const filters = this.buildFilters(organizationId, query);

    let whereClause = and(...filters);
    if (query.unitId) {
      whereClause = and(whereClause, eq(locationTags.unitId, query.unitId));
    }

    const selection = {
      id: skus.id,
      skuName: skus.skuName,
      skuCategory: skus.skuCategory,
      skuUnit: skus.skuUnit,
      quantity: skus.quantity,
      effectiveDate: skus.effectiveDate,
      expiryDate: skus.expiryDate,
      skuId: skus.skuId,
      locationTagId: skus.locationTagId,
      organizationId: skus.organizationId,
      createdAt: skus.createdAt,
      locationTagName: locationTags.locationTagName,
      unitId: locationTags.unitId,
    };

    const items = await db
      .select(selection)
      .from(skus)
      .leftJoin(locationTags, eq(skus.locationTagId, locationTags.id))
      .where(whereClause)
      .orderBy(skus.createdAt)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(skus)
      .leftJoin(locationTags, eq(skus.locationTagId, locationTags.id))
      .where(whereClause);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findById(id: string, organizationId: string) {
    const result = await db
      .select({
        id: skus.id,
        skuName: skus.skuName,
        skuCategory: skus.skuCategory,
        skuUnit: skus.skuUnit,
        quantity: skus.quantity,
        effectiveDate: skus.effectiveDate,
        expiryDate: skus.expiryDate,
        skuId: skus.skuId,
        locationTagId: skus.locationTagId,
        organizationId: skus.organizationId,
        createdAt: skus.createdAt,
        locationTagName: locationTags.locationTagName,
        unitId: locationTags.unitId,
      })
      .from(skus)
      .leftJoin(locationTags, eq(skus.locationTagId, locationTags.id))
      .where(and(eq(skus.id, id), eq(skus.organizationId, organizationId)))
      .limit(1);

    return result[0] ?? null;
  }

  async findBySkuId(organizationId: string, skuId: string, excludeSkuDbId?: string) {
    const filters = [eq(skus.organizationId, organizationId), eq(skus.skuId, skuId)];
    if (excludeSkuDbId) {
      filters.push(ne(skus.id, excludeSkuDbId));
    }

    const [result] = await db
      .select()
      .from(skus)
      .where(and(...filters))
      .limit(1);

    return result ?? null;
  }

  async create(payload: CreateSkuDto): Promise<SkuEntity> {
    const [created] = await db.insert(skus).values(payload).returning();
    return created;
  }

  async update(id: string, organizationId: string, data: UpdateSkuDto): Promise<SkuEntity | null> {
    const [updated] = await db
      .update(skus)
      .set(data)
      .where(and(eq(skus.id, id), eq(skus.organizationId, organizationId)))
      .returning();

    return updated ?? null;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const deleted = await db
      .delete(skus)
      .where(and(eq(skus.id, id), eq(skus.organizationId, organizationId)))
      .returning({ id: skus.id });

    return deleted.length > 0;
  }
}
