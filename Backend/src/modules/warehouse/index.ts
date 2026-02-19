import { FastifyInstance } from 'fastify';

import { unitsRoutes } from './units/routes.js';
import { layoutsRoutes, layoutRoutes } from './layouts/routes.js';
import { liveMapRoutes, unitSearchRoutes } from './live-map/routes.js';
import { componentsRoutes, componentRoutes } from './components/routes.js';
import { unitLocationTagsRoutes, locationTagsRoutes } from './location-tags/routes.js';

export async function registerWarehouseModule(app: FastifyInstance) {
  await app.register(unitsRoutes, { prefix: '/api/units' });
  await app.register(layoutRoutes, { prefix: '/api/layouts' });
  await app.register(componentRoutes, { prefix: '/api/components' });
  await app.register(locationTagsRoutes, { prefix: '/api/location-tags' });

  // Layout-scoped component routes: /api/layouts/:layoutId/components
  app.register(async (layoutScope) => {
    layoutScope.register(componentsRoutes);
  }, { prefix: '/api/layouts/:layoutId/components' });

  // Nested routes: /api/units/:unitId/layouts, /api/units/:unitId/live-map, /api/units/:unitId/search
  app.register(async (unitScope) => {
    unitScope.register(layoutsRoutes, { prefix: '/layouts' });
    unitScope.register(liveMapRoutes, { prefix: '/live-map' });
    unitScope.register(componentsRoutes, { prefix: '/layouts/:layoutId/components' });
    unitScope.register(unitLocationTagsRoutes, { prefix: '/location-tags' });
    unitScope.register(unitSearchRoutes, { prefix: '/search' });
  }, { prefix: '/api/units/:unitId' });
}
