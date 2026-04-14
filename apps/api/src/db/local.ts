import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Path to the D1 local state directory
const d1StateDir = path.resolve(
  import.meta.dir,
  '../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
);

// Find the actual database file (favor placeholder for local dev alignment)
const files = fs.readdirSync(d1StateDir);
const dbFile = files.find(f => f === '00000000-0000-0000-0000-000000000000.sqlite') 
             || files.find(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
             || '00000000-0000-0000-0000-000000000000.sqlite';

const sqlitePath = path.join(d1StateDir, dbFile);

const sqlite = new Database(sqlitePath);
export const db = drizzle(sqlite, { schema });

console.log('✅ Connected to local database at:', sqlitePath);
