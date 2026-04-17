import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleBun } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { db as localDb } from './local';

export type Bindings = {
  DB: any; // D1Database in prod, Bun SQLite in dev
};

export function getDb(db?: any) {
  // If db is explicitly provided and usable, use it
  if (db) {
    // If it's already a drizzle instance, return as-is
    if (db.select) {
      return db;
    }
    
    // bun:sqlite has a 'query' static method on its Database class
    // D1 has a different internal structure
    const isBunSqlite = db.constructor?.name === 'Database' && typeof db.prepare === 'function';
    
    if (isBunSqlite) {
      return drizzleBun(db, { schema });
    }
    
    // Assume D1
    return drizzleD1(db, { schema });
  }
  
  // Fall back to local development database
  return localDb;
}
