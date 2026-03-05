import type { FastifyInstance } from 'fastify';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { assets } from '../../../database/schema/index.js';
import { LiveMapRepository } from './repository.js';
import { emitLocationTagStats, type LocationTagStatsPayload } from '../../../realtime/handlers/index.js';

export class LiveMapWebSocketService {
  constructor(
    private readonly repository: LiveMapRepository,
    private readonly app: FastifyInstance,
  ) {}

  /**
   * Calculate and broadcast location tag statistics for a unit
   */
  async broadcastLocationTagStats(unitId: string, organizationId: string, layoutId: string) {
    try {
      const data = await this.repository.getUnitWithLayouts(unitId, organizationId);
      if (!data) return;

      const layoutComponents = await Promise.all(
        data.layouts.map((layout) => this.repository.getLayoutComponents(layout.id, organizationId)),
      );

      // Calculate statistics
      const allComponents = layoutComponents.flat();
      const locationTagIds = new Set(
        allComponents
          .map((component) => component.locationTagId)
          .filter((id): id is string => Boolean(id)),
      );

      // Get all SKUs for this unit's location tags
      const skusByLocationTag = await this.repository.getSkusForLocationTags(
        Array.from(locationTagIds),
        organizationId,
      );
      
      // Count unique SKU names (not just SKU IDs, as multiple records can have same SKU name)
      const uniqueSkuNames = new Set(skusByLocationTag.map((sku) => sku.skuName));

      // Count physical assets linked to any of this unit's location tags
      const locationTagIdList = Array.from(locationTagIds);
      const totalAssets = locationTagIdList.length > 0
        ? (await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(assets)
            .where(
              and(
                eq(assets.organizationId, organizationId),
                inArray(assets.locationTagId, locationTagIdList),
              ),
            )
          )[0]?.count ?? 0
        : 0;

      const payload: LocationTagStatsPayload = {
        unitId,
        layoutId,
        totalLocationTags: locationTagIds.size,
        totalSkus: uniqueSkuNames.size,
        totalComponents: allComponents.length,
        totalAssets,
        timestamp: new Date().toISOString(),
      };

      // Emit to all connected clients viewing this unit
      emitLocationTagStats(this.app.io, unitId, payload);

      this.app.log.info({ payload }, 'Broadcasted location tag stats');

      return payload;
    } catch (error) {
      this.app.log.error({ error }, 'Error broadcasting location tag stats');
      throw error;
    }
  }

  /**
   * Broadcast stats when a component is created
   */
  async onComponentCreated(unitId: string, organizationId: string, layoutId: string) {
    await this.broadcastLocationTagStats(unitId, organizationId, layoutId);
  }

  /**
   * Broadcast stats when a component is deleted
   */
  async onComponentDeleted(unitId: string, organizationId: string, layoutId: string) {
    await this.broadcastLocationTagStats(unitId, organizationId, layoutId);
  }

  /**
   * Broadcast stats when a location tag is attached/detached
   */
  async onLocationTagChanged(unitId: string, organizationId: string, layoutId: string) {
    await this.broadcastLocationTagStats(unitId, organizationId, layoutId);
  }
}
