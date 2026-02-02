import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '../../../config/database.js';
import { skuMovements, locationTags, users, skus } from '../../../database/schema/index.js';
import type { SkuMovementQueryInput } from './schemas.js';

export type LogMovementDto = {
  skuId: string;
  organizationId: string;
  fromLocationTagId: string | null;
  toLocationTagId: string;
  movedByUserId?: string | undefined;
};

export class SkuMovementsRepository {
  private toLocationAlias = alias(locationTags, 'to_location_tags');
  private fromLocationAlias = alias(locationTags, 'from_location_tags');

  async logMovement(payload: LogMovementDto) {
    await db.insert(skuMovements).values({
      skuId: payload.skuId,
      organizationId: payload.organizationId,
      fromLocationTagId: payload.fromLocationTagId,
      toLocationTagId: payload.toLocationTagId,
      movedByUserId: payload.movedByUserId ?? payload.organizationId,
    });
  }

  private buildFilters(organizationId: string, query: SkuMovementQueryInput) {
    const filters = [eq(skuMovements.organizationId, organizationId)];

    if (query.skuId) {
      filters.push(eq(skuMovements.skuId, query.skuId));
    }
    if (query.fromLocationTagId) {
      filters.push(eq(skuMovements.fromLocationTagId, query.fromLocationTagId));
    }
    if (query.toLocationTagId) {
      filters.push(eq(skuMovements.toLocationTagId, query.toLocationTagId));
    }
    if (query.movedByUserId) {
      filters.push(eq(skuMovements.movedByUserId, query.movedByUserId));
    }
    if (query.startDate) {
      filters.push(gte(skuMovements.movedAt, new Date(query.startDate)));
    }
    if (query.endDate) {
      filters.push(lte(skuMovements.movedAt, new Date(query.endDate)));
    }

    return filters;
  }

  async list(organizationId: string, query: SkuMovementQueryInput) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const toTag = this.toLocationAlias;
    const fromTag = this.fromLocationAlias;

    const filters = this.buildFilters(organizationId, query);
    let whereClause = and(...filters);
    if (query.unitId) {
      whereClause = and(whereClause, eq(toTag.unitId, query.unitId));
    }

    const baseQuery = db
      .select({
        id: skuMovements.id,
        skuId: skuMovements.skuId,
        fromLocationTagId: skuMovements.fromLocationTagId,
        toLocationTagId: skuMovements.toLocationTagId,
        movedAt: skuMovements.movedAt,
        movedByUserId: skuMovements.movedByUserId,
        fromLocationTagName: fromTag.locationTagName,
        toLocationTagName: toTag.locationTagName,
        toUnitId: toTag.unitId,
        skuName: skus.skuName,
        moverEmail: users.email,
      })
      .from(skuMovements)
      .leftJoin(toTag, eq(skuMovements.toLocationTagId, toTag.id))
      .leftJoin(fromTag, eq(skuMovements.fromLocationTagId, fromTag.id))
      .leftJoin(users, eq(skuMovements.movedByUserId, users.id))
      .leftJoin(skus, eq(skuMovements.skuId, skus.id))
      .where(whereClause);

    const itemsQuery = baseQuery.orderBy(desc(skuMovements.movedAt)).limit(limit).offset(offset);

    const countQuery = db
      .select({ total: count() })
      .from(skuMovements)
      .leftJoin(toTag, eq(skuMovements.toLocationTagId, toTag.id))
      .where(whereClause);

    const [items, [{ total }]] = await Promise.all([itemsQuery, countQuery]);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async getHistory(skuId: string, organizationId: string) {
    return db
      .select({
        id: skuMovements.id,
        fromLocationTagId: skuMovements.fromLocationTagId,
        toLocationTagId: skuMovements.toLocationTagId,
        movedAt: skuMovements.movedAt,
        fromLocationTagName: locationTags.locationTagName,
      })
      .from(skuMovements)
      .leftJoin(locationTags, eq(skuMovements.toLocationTagId, locationTags.id))
      .where(and(eq(skuMovements.skuId, skuId), eq(skuMovements.organizationId, organizationId)))
      .orderBy(desc(skuMovements.movedAt))
      .limit(100);
  }
}
