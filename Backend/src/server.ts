import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';

async function start() {
  const env = loadEnv();
  const app = await buildApp();

  const stop = async () => {
    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error(error);
      process.exit(1);
    }
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`Server listening on ${env.HOST}:${env.PORT}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
