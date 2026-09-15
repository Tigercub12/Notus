import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import * as schema from './schema';

export function getDb() {
  const ctx = getRequestContext();
  if (!ctx.env.DB) {
    throw new Error('D1 Database binding not found in environment');
  }
  return drizzle(ctx.env.DB, { schema });
}
