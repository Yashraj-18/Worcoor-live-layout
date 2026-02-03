import { and, count, eq, ilike } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { assets, locationTags } from '../../../database/schema/index.js';
import type { AssetQueryInput } from './schemas.js';

export type AssetEntity = typeof assets.$inferSelect;
export type CreateAssetDto = Omit<AssetEntity, 'id' | 'createdAt'>;
export type UpdateAssetDto = Partial<Omit<CreateAssetDto, 'organizationId'>>;

export class AssetsRepository {
  private buildFilters(organizationId: string, query: AssetQueryInput) {
    const filters = [eq(assets.organizationId, organizationId)];

    if (query.search) {
      filters.push(ilike(assets.assetName, `%${query.search}%`));
    }

    if (query.locationTagId) {
      filters.push(eq(assets.locationTagId, query.locationTagId));
    }

    return filters;
  }

  async list(organizationId: string, query: AssetQueryInput) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const filters = this.buildFilters(organizationId, query);

    let whereClause = and(...filters);
    if (query.unitId) {
      whereClause = and(whereClause, eq(locationTags.unitId, query.unitId));
    }

    const selection = {
      id: assets.id,
      assetId: assets.assetId,
      assetName: assets.assetName,
      assetType: assets.assetType,
      organizationId: assets.organizationId,
      locationTagId: assets.locationTagId,
      createdAt: assets.createdAt,
      locationTagName: locationTags.locationTagName,
      unitId: locationTags.unitId,
    };

    const items = await db
      .select(selection)
      .from(assets)
      .leftJoin(locationTags, eq(assets.locationTagId, locationTags.id))
      .where(whereClause)
      .orderBy(assets.createdAt)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(assets)
      .leftJoin(locationTags, eq(assets.locationTagId, locationTags.id))
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
        id: assets.id,
        assetId: assets.assetId,
        assetName: assets.assetName,
        assetType: assets.assetType,
        organizationId: assets.organizationId,
        locationTagId: assets.locationTagId,
        createdAt: assets.createdAt,
        locationTagName: locationTags.locationTagName,
        unitId: locationTags.unitId,
      })
      .from(assets)
      .leftJoin(locationTags, eq(assets.locationTagId, locationTags.id))
      .where(and(eq(assets.id, id), eq(assets.organizationId, organizationId)))
      .limit(1);

    return result[0] ?? null;
  }

  async create(payload: CreateAssetDto): Promise<AssetEntity> {
    const [created] = await db.insert(assets).values(payload).returning();
    return created;
  }

  async findByAssetId(organizationId: string, assetId: string) {
    const [result] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.organizationId, organizationId), eq(assets.assetId, assetId)))
      .limit(1);

    return result ?? null;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateAssetDto,
  ): Promise<AssetEntity | null> {
    const [updated] = await db
      .update(assets)
      .set(data)
      .where(and(eq(assets.id, id), eq(assets.organizationId, organizationId)))
      .returning();

    return updated ?? null;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const deleted = await db
      .delete(assets)
      .where(and(eq(assets.id, id), eq(assets.organizationId, organizationId)))
      .returning({ id: assets.id });

    return deleted.length > 0;
  }
}
