import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Bindings = {
  DB: D1Database;
};

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
