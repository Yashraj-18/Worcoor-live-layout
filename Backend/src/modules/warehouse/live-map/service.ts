import type { FastifyReply, FastifyRequest } from 'fastify';

import { LiveMapRepository } from './repository.js';

export class LiveMapService {
  constructor(private readonly repository: LiveMapRepository) {}

  async getLiveMap(
    request: FastifyRequest<{ Params: { unitId: string } }>,
    reply: FastifyReply,
  ) {
    const { unitId } = request.params;
    const organizationId = request.user.organizationId;

    const data = await this.repository.getUnitWithLayouts(unitId, organizationId);
    if (!data) {
      return reply.code(404).send({ error: 'Unit not found' });
    }

    const utilization = await this.repository.calculateUtilization(unitId, organizationId);

    const layoutComponents = await Promise.all(
      data.layouts.map((layout) => this.repository.getLayoutComponents(layout.id, organizationId)),
    );
    const locationTagIds = layoutComponents
      .flat()
      .map((component) => component.locationTagId)
      .filter((id): id is string => Boolean(id));

    const skusByLocationTag = await this.repository.getSkusForLocationTags(locationTagIds, organizationId);
    const skuMap = skusByLocationTag.reduce<Record<string, typeof skusByLocationTag>>((acc, sku) => {
      if (!acc[sku.locationTagId ?? '']) acc[sku.locationTagId ?? ''] = [];
      acc[sku.locationTagId ?? ''].push(sku);
      return acc;
    }, {});

    const layoutsWithComponents = data.layouts.map((layout, index) => {
      const componentsData = layoutComponents[index];

      const componentsWithSkus = componentsData.map((component) => {
        const skusData = component.locationTagId ? skuMap[component.locationTagId] ?? [] : [];
        const currentItems = skusData.reduce((sum, sku) => sum + Number(sku.quantity || 0), 0);
        const capacity = component.capacity || 0;
        const locationUtilization = capacity > 0 ? Math.round((currentItems / capacity) * 100 * 10) / 10 : 0;

        return {
          id: component.id,
          componentType: component.componentType,
          displayName: component.displayName,
          positionX: component.positionX,
          positionY: component.positionY,
          width: component.width,
          height: component.height,
          color: component.color,
          locationTag: component.locationTagId
            ? {
                id: component.locationTagId,
                tagName: component.locationTagName,
                capacity,
                currentItems,
                utilizationPercentage: locationUtilization,
                skus: skusData,
              }
            : null,
        };
      });

      return {
        id: layout.id,
        layoutName: layout.layoutName,
        components: componentsWithSkus,
      };
    });

    reply.send({
      unit: {
        id: data.unit.id,
        unitName: data.unit.unitName,
        status: data.unit.status,
        utilizationPercentage: utilization.utilizationPercentage,
      },
      layouts: layoutsWithComponents,
    });
  }

  async search(
    request: FastifyRequest<{ Params: { unitId: string }; Querystring: { q: string } }>,
    reply: FastifyReply,
  ) {
    const { unitId } = request.params;
    const { q: query } = request.query;

    if (!query || query.length < 2) {
      return reply.code(400).send({ error: 'Search query must be at least 2 characters' });
    }

    const results = await this.repository.search(unitId, request.user.organizationId, query);
    reply.send({ results });
  }
}