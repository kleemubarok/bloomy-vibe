import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

function getLocalDbPath(): string {
  // Path to the D1 local state directory
  const d1StateDir = path.resolve(
    import.meta.dir,
    '../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
  );

  // Check if D1 state exists
  if (fs.existsSync(d1StateDir)) {
    const files = fs.readdirSync(d1StateDir);
    const dbFile = files.find(f => f === '00000000-0000-0000-0000-000000000000.sqlite') 
                 || files.find(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
                 || '00000000-0000-0000-0000-000000000000.sqlite';
    return path.join(d1StateDir, dbFile);
  }

  // Fallback: use local sqlite file
  const localDbPath = path.resolve(import.meta.dir, '../../data/local.db');
  const dataDir = path.dirname(localDbPath);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return localDbPath;
}

const sqlitePath = getLocalDbPath();
const sqliteDb = new Database(sqlitePath);
export const db = drizzle(sqliteDb, { schema });

console.log('✅ Connected to local database at:', sqlitePath);
