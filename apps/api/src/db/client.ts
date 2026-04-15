import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Bindings = {
  DB: any; // D1Database in prod, mocked in test
};

export function getDb(d1?: any) {
  if (!d1) {
    const { db } = require('./local');
    return db;
  }
  return drizzle(d1, { schema });
}
