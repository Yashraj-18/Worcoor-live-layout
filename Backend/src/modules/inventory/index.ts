import { FastifyInstance } from 'fastify';

import { skusRoutes } from './skus/routes.js';
import { assetsRoutes } from './assets/routes.js';
import { skuMovementsRoutes } from './sku-movements/routes.js';

export async function registerInventoryModule(app: FastifyInstance) {
  await app.register(skusRoutes, { prefix: '/api/skus' });
  await app.register(assetsRoutes, { prefix: '/api/assets' });
  await app.register(skuMovementsRoutes, { prefix: '/api/sku-movements' });
}
