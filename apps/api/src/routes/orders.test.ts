import { describe, it, expect, beforeAll } from 'bun:test';
import app from '../index';
import { db } from '../db/local';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

const JWT_SECRET = 'bloomy-vibe-secret-change-me-in-prod';

describe('Order Lifecycle API', () => {
  let ownerToken: string;
  let staffToken: string;
  let product1Id: number;
  let product2Id: number;

  beforeAll(async () => {
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.email, 'owner@bloomy.id')).limit(1);
    const [staff] = await db.select().from(schema.users).where(eq(schema.users.email, 'staf@bloomy.id')).limit(1);

    const products = await db.select().from(schema.products).where(eq(schema.products.isDeleted, false)).limit(2);
    
    if (products.length >= 2) {
      product1Id = products[0].id;
      product2Id = products[1].id;
    }

    if (!owner || !staff) {
      throw new Error('Seed data missing. Run bun run db:seed first!');
    }
    
    ownerToken = await sign({ id: owner.id, email: owner.email, role: 'owner', exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);
    staffToken = await sign({ id: staff.id, email: staff.email, role: 'staff', exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);
  });

  describe('Create Order', () => {
    it('should create a draft order', async () => {
      const res = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'Test Customer',
          customerWhatsapp: '08123456789',
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      if (res.status === 500) console.log('Err:', await res.text());
      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.customerName).toBe('Test Customer');
      expect(data.status).toBe('Draft');
      expect(data.totalAmount).toBe(50000);
      expect(data.items).toHaveLength(1);
    });

    it('should reject order without customer name', async () => {
      const res = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      expect(res.status).toBe(400);
    });
  });

  describe('Soft-Hold (Move to Queue)', () => {
    it('should move draft order to Antri status', async () => {
      const createRes = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'Hold Test Customer',
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      const order = await createRes.json();
      
      const holdRes = await app.request(`/api/orders/${order.id}/hold`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }, {});
      
      expect(holdRes.status).toBe(200);
      const held = await holdRes.json();
      expect(held.message).toContain('reserved');
    });

    it('should reject hold on non-draft order', async () => {
      const createRes = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'Already Antri Customer',
          status: 'Antri',
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      const order = await createRes.json();
      
      const holdRes = await app.request(`/api/orders/${order.id}/hold`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }, {});
      
      expect(holdRes.status).toBe(400);
    });
  });

  describe('Checkout', () => {
    it('should checkout order with idempotency key', async () => {
      const createRes = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'Checkout Test Customer',
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      const order = await createRes.json();
      
      await app.request(`/api/orders/${order.id}/hold`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      }, {});
      
      const checkoutRes = await app.request(`/api/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Idempotency-Key': `test-checkout-${Date.now()}`
        }
      }, {});
      
      expect(checkoutRes.status).toBe(200);
      const result = await checkoutRes.json();
      expect(result.message).toBe('Checkout successful');
      expect(result.order.status).toBe('Dirangkai');
      expect(result.hppSnapshot).toBeDefined();
      expect(result.hppSnapshot.totalHpp).toBeGreaterThan(0);
    });

    it('should reject checkout without idempotency key', async () => {
      const createRes = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'No Key Customer',
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      const order = await createRes.json();
      
      await app.request(`/api/orders/${order.id}/hold`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      }, {});
      
      const checkoutRes = await app.request(`/api/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }, {});
      
      expect(checkoutRes.status).toBe(400);
    });

    it('should detect duplicate checkout via idempotency', async () => {
      const createRes = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'Duplicate Customer',
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      const order = await createRes.json();
      
      await app.request(`/api/orders/${order.id}/hold`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      }, {});
      
      const idempotencyKey = `dup-${Date.now()}`;
      
      const checkout1 = await app.request(`/api/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Idempotency-Key': idempotencyKey
        }
      }, {});
      
      const checkout2 = await app.request(`/api/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Idempotency-Key': idempotencyKey
        }
      }, {});
      
      expect(checkout2.status).toBe(200);
      const result = await checkout2.json();
      expect(result.message).toBe('Already processed');
    });
  });

  describe('Inventory Deduction', () => {
    it('should deduct inventory on checkout and log it', async () => {
      const [rose] = await db.select().from(schema.inventory).where(eq(schema.inventory.name, 'Mawar Merah')).limit(1);
      const initialStock = rose?.stockLevel || 0;

      const createRes = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: 'Stock Test Customer',
          items: [
            { productId: product1Id, quantity: 1, unitPriceAtOrder: 50000 }
          ]
        })
      }, {});
      
      const order = await createRes.json();
      
      await app.request(`/api/orders/${order.id}/hold`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      }, {});
      
      await app.request(`/api/orders/${order.id}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Idempotency-Key': `stock-${Date.now()}`
        }
      }, {});
      
      const [updatedRose] = await db.select().from(schema.inventory).where(eq(schema.inventory.id, rose!.id)).limit(1);
      
      expect(updatedRose!.stockLevel).toBeLessThan(initialStock);

      const logs = await db
        .select()
        .from(schema.inventoryLog)
        .where(eq(schema.inventoryLog.orderId, order.id));
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].reason).toBe('Order Sale');
    });
  });

  describe('Order List & Get', () => {
    it('should list orders', async () => {
      const res = await app.request('/api/orders', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      }, {});
      
      expect(res.status).toBe(200);
      const orders = await res.json();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      const res = await app.request('/api/orders?status=Dirangkai', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      }, {});
      
      expect(res.status).toBe(200);
      const orders = await res.json();
      expect(Array.isArray(orders)).toBe(true);
    });
  });
});
