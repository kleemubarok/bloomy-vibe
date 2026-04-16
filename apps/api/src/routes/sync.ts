import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getDb, type Bindings } from '../db/client';
import { verifyAuth } from '../middleware/guard';
import { processBatchSync, type SyncOperation } from '../lib/merge';

const sync = new Hono<{ Bindings: Bindings }>();

sync.post('/', verifyAuth, async (c) => {
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  if (!body.operations || !Array.isArray(body.operations)) {
    throw new HTTPException(400, { message: 'operations array is required' });
  }

  if (body.operations.length === 0) {
    return c.json({ synced: [], failed: [] });
  }

  const operations: SyncOperation[] = body.operations.map((op: any) => ({
    id: op.id,
    entityType: op.entityType,
    entityId: op.entityId,
    operation: op.operation,
    payload: op.payload || {},
    timestamp: op.timestamp || Date.now(),
  }));

  const result = await processBatchSync(db as any, operations);

  return c.json(result);
});

export default sync;
