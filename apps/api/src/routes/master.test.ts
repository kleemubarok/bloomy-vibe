import { describe, it, expect, beforeAll } from 'bun:test';
import app from '../index';
import { db } from '../db/local';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

const JWT_SECRET = 'bloomy-vibe-secret-change-me-in-prod';

describe('Master Data API', () => {
  let ownerToken: string;
  let staffToken: string;
  let ownerId: number;

  beforeAll(async () => {
    // We already seeded before, but let's grab an owner to get their ID
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.email, 'owner@bloomy.id')).limit(1);
    const [staff] = await db.select().from(schema.users).where(eq(schema.users.email, 'staf@bloomy.id')).limit(1);

    if (!owner || !staff) {
        throw new Error('Seed data missing. Run bun run db:seed first!');
    }
    
    ownerId = owner.id;

    ownerToken = await sign({ id: owner.id, email: owner.email, role: 'owner', exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);
    staffToken = await sign({ id: staff.id, email: staff.email, role: 'staff', exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);
  });

  describe('Inventory Endpoint', () => {
    let newInventoryId: number;

    it('should NOT allow staff to create inventory', async () => {
      const res = await app.request('/api/inventory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${staffToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Staff Try', sku: 'S-01', unit: 'pcs' })
      }, {});
      if (res.status === 500) console.log('Err1:', await res.text());
      expect(res.status).toBe(403);
    });

    it('should allow owner to create inventory', async () => {
      const res = await app.request('/api/inventory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Test Rose', sku: `TR-${Date.now()}`, unit: 'tangkai', stockLevel: 100, reorderLevel: 5 })
      }, {});
      if (res.status === 500) console.log('Err2:', await res.text());
      expect(res.status).toBe(210);
      const data = await res.json();
      expect(data.name).toBe('Test Rose');
      expect(data.stockLevel).toBe(100);
      newInventoryId = data.id;
    });

    it('should allow anyone (authenticated) to list inventory', async () => {
      const res = await app.request('/api/inventory', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${staffToken}` }
      }, {});
      if (res.status === 500) console.log('Err3:', await res.text());
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });
});
