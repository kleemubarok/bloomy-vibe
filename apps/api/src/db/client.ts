import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleBun } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

export type Bindings = {
  DB: any; // D1Database in prod, Bun SQLite in dev
};

export function getDb(db?: any) {
  if (!db) {
    throw new Error('Database binding not found');
  }
  
  // If it's already a drizzle instance, return as-is
  if (db.select) {
    return db;
  }
  
  // bun:sqlite has a 'query' static method on its Database class
  // D1 has a different internal structure
  // Check for bun:sqlite by trying to detect the internal interface
  const isBunSqlite = db.constructor.name === 'Database' && typeof db.prepare === 'function';
  
  if (isBunSqlite) {
    return drizzleBun(db, { schema });
  }
  
  // Assume D1
  return drizzleD1(db, { schema });
}
