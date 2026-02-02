import { and, eq, ilike, inArray, sql } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import {
  units,
  layouts,
  components,
  locationTags,
  skus,
} from '../../../database/schema/index.js';

export class LiveMapRepository {
  async getUnitWithLayouts(unitId: string, organizationId: string) {
    const unit = await db
      .select()
      .from(units)
      .where(and(eq(units.id, unitId), eq(units.organizationId, organizationId)))
      .limit(1);

    if (!unit[0]) return null;

    const unitLayouts = await db
      .select()
      .from(layouts)
      .where(and(eq(layouts.unitId, unitId), eq(layouts.organizationId, organizationId)));

    return { unit: unit[0], layouts: unitLayouts };
  }

  async getLayoutComponents(layoutId: string, organizationId: string) {
    return db
      .select({
        id: components.id,
        componentType: components.componentType,
        displayName: components.displayName,
        positionX: components.positionX,
        positionY: components.positionY,
        width: components.width,
        height: components.height,
        color: components.color,
        locationTagId: components.locationTagId,
        locationTagName: locationTags.locationTagName,
        capacity: locationTags.capacity,
      })
      .from(components)
      .leftJoin(locationTags, eq(components.locationTagId, locationTags.id))
      .where(and(eq(components.layoutId, layoutId), eq(components.organizationId, organizationId)));
  }

  async getLocationTagSkus(locationTagId: string, organizationId: string) {
    return db
      .select({
        id: skus.id,
        skuName: skus.skuName,
        quantity: skus.quantity,
        skuUnit: skus.skuUnit,
      })
      .from(skus)
      .where(and(eq(skus.locationTagId, locationTagId), eq(skus.organizationId, organizationId)));
  }

  async getSkusForLocationTags(locationTagIds: string[], organizationId: string) {
    if (locationTagIds.length === 0) {
      return [];
    }

    return db
      .select({
        id: skus.id,
        skuName: skus.skuName,
        quantity: skus.quantity,
        skuUnit: skus.skuUnit,
        locationTagId: skus.locationTagId,
      })
      .from(skus)
      .where(
        and(eq(skus.organizationId, organizationId), inArray(skus.locationTagId, locationTagIds)),
      );
  }

  async calculateUtilization(unitId: string, organizationId: string) {
    const result = await db
      .select({
        totalCapacity: sql<number>`COALESCE(SUM(${locationTags.capacity}), 0)`,
        totalItems: sql<number>`COALESCE(SUM(${skus.quantity}), 0)`,
      })
      .from(components)
      .innerJoin(locationTags, eq(components.locationTagId, locationTags.id))
      .leftJoin(skus, eq(skus.locationTagId, locationTags.id))
      .innerJoin(layouts, eq(components.layoutId, layouts.id))
      .where(and(eq(layouts.unitId, unitId), eq(components.organizationId, organizationId)));

    const { totalCapacity, totalItems } = result[0] || { totalCapacity: 0, totalItems: 0 };
    const utilization = totalCapacity > 0 ? (totalItems / totalCapacity) * 100 : 0;

    return { totalCapacity, totalItems, utilizationPercentage: Math.round(utilization * 10) / 10 };
  }

  async search(unitId: string, organizationId: string, query: string) {
    const searchPattern = `%${query}%`;

    // Search locations
    const locationResults = await db
      .select({
        type: sql<string>`'location'`,
        id: locationTags.id,
        name: locationTags.locationTagName,
        componentId: components.id,
      })
      .from(locationTags)
      .innerJoin(components, eq(components.locationTagId, locationTags.id))
      .innerJoin(layouts, eq(components.layoutId, layouts.id))
      .where(
        and(
          eq(layouts.unitId, unitId),
          eq(locationTags.organizationId, organizationId),
          ilike(locationTags.locationTagName, searchPattern),
        ),
      );

    // Search SKUs
    const skuResults = await db
      .select({
        type: sql<string>`'sku'`,
        id: skus.id,
        name: skus.skuName,
        locationTagId: skus.locationTagId,
      })
      .from(skus)
      .innerJoin(locationTags, eq(skus.locationTagId, locationTags.id))
      .innerJoin(components, eq(components.locationTagId, locationTags.id))
      .innerJoin(layouts, eq(components.layoutId, layouts.id))
      .where(
        and(
          eq(layouts.unitId, unitId),
          eq(skus.organizationId, organizationId),
          ilike(skus.skuName, searchPattern),
        ),
      );

    return [...locationResults, ...skuResults];
  }
}
