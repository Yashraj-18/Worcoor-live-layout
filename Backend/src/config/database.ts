import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import { loadEnv } from './env.js';

const env = loadEnv();

// Use postgres.js with prepare: false for Supabase transaction pooler compatibility
const client = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false, // Required for Supabase transaction pooler
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development',
});

// Legacy export for compatibility
export function getPool() {
  return client;
}
