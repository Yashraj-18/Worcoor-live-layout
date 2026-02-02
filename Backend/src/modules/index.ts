import { FastifyInstance } from 'fastify';

import { registerAuthModule } from './auth/index.js';
import { registerWarehouseModule } from './warehouse/index.js';
import { registerInventoryModule } from './inventory/index.js';
import { registerUsersModule } from './users/index.js';

export async function registerModules(app: FastifyInstance) {
  await registerAuthModule(app);
  await registerUsersModule(app);
  await registerWarehouseModule(app);
  await registerInventoryModule(app);
}
