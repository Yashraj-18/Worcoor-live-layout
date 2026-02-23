import type { FastifyReply, FastifyRequest } from 'fastify';

import { LiveMapRepository } from './repository.js';

export class LiveMapStatsService {
  constructor(private readonly repository: LiveMapRepository) {}

  async getUnitStats(
    request: FastifyRequest<{ Params: { unitId: string } }>,
    reply: FastifyReply,
  ) {
    const { unitId } = request.params;
    const organizationId = request.user.organizationId;

    const data = await this.repository.getUnitWithLayouts(unitId, organizationId);
    if (!data) {
      return reply.code(404).send({ error: 'Unit not found' });
    }

    // Get all components across all layouts
    const layoutComponents = await Promise.all(
      data.layouts.map((layout) => this.repository.getLayoutComponents(layout.id, organizationId)),
    );

    const allComponents = layoutComponents.flat();

    // Get all location tag IDs
    const locationTagIds = allComponents
      .map((component) => component.locationTagId)
      .filter((id): id is string => Boolean(id));

    const uniqueLocationTagIds = Array.from(new Set(locationTagIds));

    // Get all SKUs for these location tags
    const skusByLocationTag = await this.repository.getSkusForLocationTags(
      uniqueLocationTagIds,
      organizationId,
    );

    // Count unique SKU names
    const uniqueSkuNames = new Set(skusByLocationTag.map((sku) => sku.skuName));

    const stats = {
      unitId,
      totalLocationTags: uniqueLocationTagIds.length,
      totalSkus: uniqueSkuNames.size,
      totalComponents: allComponents.length,
      totalAssets: allComponents.length,
      timestamp: new Date().toISOString(),
    };

    reply.send(stats);
  }
}
