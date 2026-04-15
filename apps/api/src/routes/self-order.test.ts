import { describe, it, expect, beforeAll } from 'bun:test';
import app from '../index';
import { db } from '../db/local';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

const JWT_SECRET = 'bloomy-vibe-secret-change-me-in-prod';

describe('Self-Order API', () => {
  let ownerToken: string;
  let productId: number;

  beforeAll(async () => {
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.email, 'owner@bloomy.id')).limit(1);
    const [product] = await db.select().from(schema.products).where(eq(schema.products.isDeleted, false)).limit(1);

    if (!owner) {
      throw new Error('Seed data missing. Run bun run db:seed first!');
    }

    productId = product!.id;

    ownerToken = await sign({ id: owner.id, email: owner.email, role: 'owner', exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);
  });

  describe('Generate Link', () => {
    it('should generate a self-order link', async () => {
      const res = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName: 'John Doe',
          quantity: 2
        })
      }, {});

      if (res.status === 500) console.log('Err:', await res.text());
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.uuid).toBeDefined();
      expect(data.url).toContain(data.uuid);
      expect(data.product.name).toBeDefined();
      expect(data.customerName).toBe('John Doe');
      expect(data.quantity).toBe(2);
    });

    it('should reject generate without auth', async () => {
      const res = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName: 'Jane Doe'
        })
      }, {});

      expect(res.status).toBe(401);
    });

    it('should reject generate with invalid product', async () => {
      const res = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: 99999,
          customerName: 'Test'
        })
      }, {});

      expect(res.status).toBe(400);
    });
  });

  describe('Validate Link', () => {
    it('should validate a valid link', async () => {
      const genRes = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName: 'Validate Test'
        })
      }, {});

      const genData = await genRes.json();

      const validateRes = await app.request(`/api/self-order/${genData.uuid}/validate`, {
        method: 'GET'
      }, {});

      expect(validateRes.status).toBe(200);
      const validateData = await validateRes.json();
      expect(validateData.valid).toBe(true);
      expect(validateData.product).toBeDefined();
    });

    it('should reject invalid uuid', async () => {
      const res = await app.request('/api/self-order/invalid-uuid-12345/validate', {
        method: 'GET'
      }, {});

      expect(res.status).toBe(404);
    });

    it('should reject used link', async () => {
      const genRes = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName: 'Used Link Test'
        })
      }, {});

      const genData = await genRes.json();

      await app.request(`/api/self-order/${genData.uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageCard: 'Happy Birthday!',
          senderName: 'Sender'
        })
      }, {});

      const validateRes = await app.request(`/api/self-order/${genData.uuid}/validate`, {
        method: 'GET'
      }, {});

      expect(validateRes.status).toBe(403);
      const validateData = await validateRes.json();
      expect(validateData.valid).toBe(false);
      expect(validateData.reason).toBe('used');
    });
  });

  describe('Submit Order', () => {
    it('should create order and mark link as used', async () => {
      const genRes = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName: 'Order Submit Test',
          quantity: 1
        })
      }, {});

      const genData = await genRes.json();

      const submitRes = await app.request(`/api/self-order/${genData.uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageCard: 'Selamat Ulang Tahun!',
          senderName: 'Papa',
          deliveryDate: new Date(Date.now() + 86400000).toISOString()
        })
      }, {});

      expect(submitRes.status).toBe(201);
      const submitData = await submitRes.json();
      expect(submitData.message).toBe('Order submitted successfully');
      expect(submitData.orderId).toBeDefined();
    });

    it('should reject submit without link', async () => {
      const res = await app.request('/api/self-order/nonexistent-uuid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageCard: 'Test'
        })
      }, {});

      expect(res.status).toBe(404);
    });

    it('should reject duplicate submit', async () => {
      const genRes = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName: 'Duplicate Test'
        })
      }, {});

      const genData = await genRes.json();

      await app.request(`/api/self-order/${genData.uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageCard: 'First submit'
        })
      }, {});

      const secondRes = await app.request(`/api/self-order/${genData.uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageCard: 'Second submit'
        })
      }, {});

      expect(secondRes.status).toBe(403);
    });
  });

  describe('Cancel Order', () => {
    it('should cancel order and return stock', async () => {
      const genRes = await app.request('/api/self-order/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName: 'Cancel Test',
          quantity: 1
        })
      }, {});

      const genData = await genRes.json();

      const submitRes = await app.request(`/api/self-order/${genData.uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageCard: 'Test'
        })
      }, {});

      const submitData = await submitRes.json();

      const links = await db.select().from(schema.selfOrderLinks).where(eq(schema.selfOrderLinks.uuid, genData.uuid));
      const linkId = links[0].id;

      const cancelRes = await app.request(`/api/self-order/${linkId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }, {});

      expect(cancelRes.status).toBe(200);
      const cancelData = await cancelRes.json();
      expect(cancelData.message).toContain('cancelled');

      const logs = await db
        .select()
        .from(schema.inventoryLog)
        .where(eq(schema.inventoryLog.orderId, submitData.orderId));

      const hasCancellationLog = logs.some(log => log.reason === 'Self-Order Cancelled');
      expect(hasCancellationLog).toBe(true);
    });
  });
});
