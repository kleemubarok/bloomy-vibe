import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import type { Bindings } from '../db/client';
import { getDb } from '../db/client';
import { verifyAuth } from '../middleware/guard';
import * as schema from '../db/schema';

const audit = new Hono<{ Bindings: Bindings }>();

audit.get('/inventory', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '100');

  const logs = await db
    .select()
    .from(schema.inventoryLog)
    .leftJoin(schema.inventory, eq(schema.inventoryLog.inventoryId, schema.inventory.id))
    .orderBy(desc(schema.inventoryLog.createdAt))
    .limit(limit);

  const mapped = logs.map((l: any) => ({
    id: l.inventory_log.id,
    inventoryId: l.inventory_log.inventoryId,
    name: l.inventory?.name || 'Unknown',
    changeQty: l.inventory_log.changeQty,
    reason: l.inventory_log.reason,
    orderId: l.inventory_log.orderId,
    createdAt: l.inventory_log.createdAt,
  }));

  return c.json(mapped);
});

audit.get('/orders', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '100');

  try {
    const orders = await db
      .select({
        id: schema.orders.id,
        customerName: schema.orders.customerName,
        totalAmount: schema.orders.totalAmount,
        totalHppSnapshot: schema.orders.totalHppSnapshot,
        paymentStatus: schema.orders.paymentStatus,
        status: schema.orders.status,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.paymentStatus, 'Paid'))
      .orderBy(desc(schema.orders.createdAt))
      .limit(limit);

    const ordersWithProfit = orders.map((o: any) => ({
      id: o.id,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      totalHppSnapshot: o.totalHppSnapshot,
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.createdAt,
      profit: o.paymentStatus === 'Paid' && o.totalHppSnapshot ? Number(o.totalAmount) - Number(o.totalHppSnapshot) : null,
    }));

    return c.json(ordersWithProfit);
  } catch (e) {
    console.error('Audit orders error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

audit.get('/summary', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);

  try {
    const allOrders = await db
      .select({
        totalAmount: schema.orders.totalAmount,
        totalHppSnapshot: schema.orders.totalHppSnapshot,
        paymentStatus: schema.orders.paymentStatus,
      })
      .from(schema.orders);

    const paidOrders = allOrders.filter((o) => o.paymentStatus === 'Paid');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalHpp = paidOrders.reduce((sum, o) => sum + (Number(o.totalHppSnapshot) || 0), 0);
    const totalProfit = totalRevenue - totalHpp;

    return c.json({
      totalOrders: paidOrders.length,
      totalRevenue,
      totalHpp,
      totalProfit,
    });
  } catch (e) {
    console.error('Audit summary error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

export default audit;