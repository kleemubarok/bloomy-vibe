import { describe, it, expect, beforeAll } from 'bun:test';
import app from '../index';
import { db } from '../db/local';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

const JWT_SECRET = 'bloomy-vibe-secret-change-me-in-prod';

describe('Sync Queue API', () => {
  let ownerToken: string;

  beforeAll(async () => {
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.email, 'owner@bloomy.id')).limit(1);

    if (!owner) {
      throw new Error('Seed data missing. Run bun run db:seed first!');
    }

    ownerToken = await sign({ id: owner.id, email: owner.email, role: 'owner', exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);
  });

  describe('POST /api/sync', () => {
    it('should reject sync without auth', async () => {
      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: [] })
      }, {});

      expect(res.status).toBe(401);
    });

    it('should reject sync without operations array', async () => {
      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }, {});

      expect(res.status).toBe(400);
    });

    it('should return empty result for empty operations', async () => {
      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operations: [] })
      }, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.synced).toEqual([]);
      expect(data.failed).toEqual([]);
    });

    it('should insert new order via sync', async () => {
      const orderId = `sync-test-${Date.now()}`;
      
      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operations: [
            {
              id: 'op-1',
              entityType: 'orders',
              entityId: orderId,
              operation: 'INSERT',
              payload: {
                customerName: 'Sync Test Customer',
                customerWhatsapp: '08123456789',
                status: 'Antri',
                orderType: 'POS'
              },
              timestamp: Date.now()
            }
          ]
        })
      }, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.synced).toHaveLength(1);
      expect(data.synced[0].localId).toBe('op-1');
      expect(data.synced[0].serverId).toBe(orderId);
      expect(data.failed).toHaveLength(0);

      const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
      expect(order?.customerName).toBe('Sync Test Customer');
    });

    it('should update existing order via sync (last-write-wins)', async () => {
      const orderId = `update-test-${Date.now()}`;
      
      await db.insert(schema.orders).values({
        id: orderId,
        customerName: 'Update Test',
        status: 'Antri',
        orderType: 'POS',
      });

      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operations: [
            {
              id: 'op-2',
              entityType: 'orders',
              entityId: orderId,
              operation: 'UPDATE',
              payload: {
                status: 'Dirangkai'
              },
              timestamp: Date.now() + 100000
            }
          ]
        })
      }, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.synced).toHaveLength(1);
      expect(data.synced[0].serverId).toBe(orderId);

      const [updated] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
      expect(updated?.status).toBe('Dirangkai');
    });

    it('should handle partial sync (mixed success and failure)', async () => {
      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operations: [
            {
              id: 'op-3',
              entityType: 'orders',
              entityId: `new-order-${Date.now()}`,
              operation: 'INSERT',
              payload: {
                customerName: 'Partial Sync Test',
                status: 'Antri',
                orderType: 'POS'
              },
              timestamp: Date.now()
            },
            {
              id: 'op-4',
              entityType: 'orders',
              entityId: 'nonexistent-order-id-xyz',
              operation: 'UPDATE',
              payload: { status: 'Selesai' },
              timestamp: Date.now()
            }
          ]
        })
      }, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data.synced).toHaveLength(1);
      expect(data.synced[0].localId).toBe('op-3');
      
      expect(data.failed).toHaveLength(1);
      expect(data.failed[0].localId).toBe('op-4');
      expect(data.failed[0].error).toContain('not found');
    });

    it('should insert order item via sync', async () => {
      const [order] = await db.select().from(schema.orders).limit(1);
      const [product] = await db.select().from(schema.products).limit(1);

      if (!order || !product) {
        throw new Error('No orders or products found');
      }

      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operations: [
            {
              id: 'op-5',
              entityType: 'order_items',
              operation: 'INSERT',
              payload: {
                orderId: order.id,
                productId: product.id,
                quantity: 2,
                unitPriceAtOrder: product.basePrice
              },
              timestamp: Date.now()
            }
          ]
        })
      }, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.synced).toHaveLength(1);
      expect(data.synced[0].localId).toBe('op-5');
    });

    it('should insert payment via sync', async () => {
      const [order] = await db.select().from(schema.orders).limit(1);

      if (!order) {
        throw new Error('No orders found');
      }

      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operations: [
            {
              id: 'op-6',
              entityType: 'payments',
              operation: 'INSERT',
              payload: {
                orderId: order.id,
                method: 'QRIS',
                amount: order.totalAmount || 50000
              },
              timestamp: Date.now()
            }
          ]
        })
      }, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.synced).toHaveLength(1);
      expect(data.synced[0].localId).toBe('op-6');
    });

    it('should batch multiple operations', async () => {
      const orderId = `batch-test-${Date.now()}`;
      const itemId = Date.now().toString();

      const res = await app.request('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operations: [
            {
              id: 'batch-1',
              entityType: 'orders',
              entityId: orderId,
              operation: 'INSERT',
              payload: {
                customerName: 'Batch Customer',
                status: 'Antri',
                orderType: 'POS'
              },
              timestamp: Date.now()
            },
            {
              id: 'batch-2',
              entityType: 'order_items',
              operation: 'INSERT',
              payload: {
                orderId: orderId,
                productId: 1,
                quantity: 1,
                unitPriceAtOrder: 50000
              },
              timestamp: Date.now() + 100
            },
            {
              id: 'batch-3',
              entityType: 'payments',
              operation: 'INSERT',
              payload: {
                orderId: orderId,
                method: 'Cash',
                amount: 50000
              },
              timestamp: Date.now() + 200
            }
          ]
        })
      }, {});

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.synced).toHaveLength(3);
      expect(data.failed).toHaveLength(0);
    });
  });
});
