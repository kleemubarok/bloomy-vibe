import { serve } from 'bun';
import app from './index';
import { Database } from 'bun:sqlite';

const sqlitePath = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/00000000-0000-0000-0000-000000000000.sqlite';
const sqliteDb = new Database(sqlitePath);

console.log('✅ Connected to local database at:', sqlitePath);
console.log('🚀 Starting Bloomy API (Local Dev with SQLite)');

const port = process.env.PORT || 3000;

serve({
  port,
  fetch: async (req) => {
    const response = await app.fetch(req, { DB: sqliteDb });
    return response;
  },
});

console.log(`✅ Server running at http://localhost:${port}`);
