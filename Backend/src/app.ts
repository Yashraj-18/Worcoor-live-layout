import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';

import { loadEnv } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerAuth } from './plugins/auth.js';
import { registerSocketIO } from './plugins/socketio.js';
import { registerModules } from './modules/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const env = loadEnv();
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  await registerCors(app, env);
  await registerAuth(app, env);
  await registerModules(app);
  await registerSocketIO(app, env);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
