import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import type { Bindings } from '../db/client';
import { getDb } from '../db/client';
import { verifyAuth } from '../middleware/guard';
import * as schema from '../db/schema';

const audit = new Hono<{ Bindings: Bindings }>();

audit.get('/inventory', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const allLogs = await db
      .select({ id: schema.inventoryLog.id })
      .from(schema.inventoryLog);

    const totalCount = allLogs.length;

    const logs = await db
      .select()
      .from(schema.inventoryLog)
      .leftJoin(schema.inventory, eq(schema.inventoryLog.inventoryId, schema.inventory.id))
      .orderBy(desc(schema.inventoryLog.createdAt))
      .limit(limit)
      .offset(offset);

    const mapped = logs.map((l: any) => ({
      id: l.inventory_log.id,
      inventoryId: l.inventory_log.inventoryId,
      name: l.inventory?.name || 'Unknown',
      unit: l.inventory?.unit || '',
      changeQty: l.inventory_log.changeQty,
      reason: l.inventory_log.reason,
      orderId: l.inventory_log.orderId,
      createdAt: l.inventory_log.createdAt,
    }));

    return c.json({
      data: mapped,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (e) {
    console.error('Audit inventory error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

audit.get('/orders', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const q = c.req.query('q') || '';
  const offset = (page - 1) * limit;

  try {
    const allOrders = await db
      .select({
        id: schema.orders.id,
        customerName: schema.orders.customerName,
      })
      .from(schema.orders)
      .where(eq(schema.orders.paymentStatus, 'Paid'));

    let filteredOrders = allOrders;
    if (q) {
      const qLower = q.toLowerCase();
      filteredOrders = allOrders.filter((o: any) => 
        o.customerName && o.customerName.toLowerCase().includes(qLower)
      );
    }

    const totalCount = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    let orders: any[] = [];
    if (paginatedOrders.length > 0) {
      const ids = paginatedOrders.map((o: any) => o.id);
      orders = await db
        .select({
          id: schema.orders.id,
          customerName: schema.orders.customerName,
          customerWhatsapp: schema.orders.customerWhatsapp,
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
    }

    const ordersWithItems = orders.map((o: any) => ({
      id: o.id,
      customerName: o.customerName,
      customerWhatsapp: o.customerWhatsapp,
      totalAmount: o.totalAmount,
      totalHppSnapshot: o.totalHppSnapshot,
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.createdAt,
      profit: o.totalHppSnapshot ? Number(o.totalAmount) - Number(o.totalHppSnapshot) : null,
    }));

    return c.json({
      data: ordersWithItems,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (e) {
    console.error('Audit orders error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

audit.get('/order/:id', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  try {
    const [order] = await db
      .select({
        id: schema.orders.id,
        customerName: schema.orders.customerName,
        customerWhatsapp: schema.orders.customerWhatsapp,
        totalAmount: schema.orders.totalAmount,
        totalHppSnapshot: schema.orders.totalHppSnapshot,
        paymentStatus: schema.orders.paymentStatus,
        status: schema.orders.status,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const items = await db
      .select({
        id: schema.orderItems.id,
        productName: schema.orderItems.productName,
        quantity: schema.orderItems.quantity,
        unitPrice: schema.orderItems.unitPrice,
        totalPrice: schema.orderItems.totalPrice,
      })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id));

    const formattedItems = items.map((i: any) => ({
      id: i.id,
      productName: i.productName || 'Unknown',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    }));

    return c.json({
      id: order.id,
      customerName: order.customerName || '-',
      customerWhatsapp: order.customerWhatsapp || null,
      totalAmount: order.totalAmount,
      totalHppSnapshot: order.totalHppSnapshot,
      paymentStatus: order.paymentStatus,
      status: order.status,
      createdAt: order.createdAt,
      items: formattedItems,
      profit: order.totalHppSnapshot ? Number(order.totalAmount) - Number(order.totalHppSnapshot) : null,
    });
  } catch (e) {
    console.error('Audit order detail error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

audit.get('/inventory-log/:id', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param('id');

  try {
    const [log] = await db
      .select()
      .from(schema.inventoryLog)
      .where(eq(schema.inventoryLog.id, parseInt(id)))
      .limit(1);

    if (!log) {
      return c.json({ error: 'Log not found' }, 404);
    }

    if (log.orderId) {
      const [order] = await db
        .select({
          id: schema.orders.id,
          customerName: schema.orders.customerName,
          totalAmount: schema.orders.totalAmount,
        })
        .from(schema.orders)
        .where(eq(schema.orders.id, log.orderId))
        .limit(1);

      return c.json({
        ...log,
        order: order || null,
      });
    }

    return c.json(log);
  } catch (e) {
    console.error('Audit inventory log detail error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

audit.get('/summary', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const period = c.req.query('period') || 'today';

  const now = new Date();
  let fromDate: Date | null = null;
  let toDate: Date = now;

  if (period === 'today') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    fromDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    toDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
  } else if (period === 'this_week') {
    const dayOfWeek = now.getDay();
    fromDate = new Date(now);
    fromDate.setDate(now.getDate() - dayOfWeek);
  } else if (period === 'this_month') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'last_month') {
    fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    toDate = new Date(now.getFullYear(), now.getMonth(), 0);
  }
  // 'all' - no date filter

  try {
    let query = db
      .select({
        totalAmount: schema.orders.totalAmount,
        totalHppSnapshot: schema.orders.totalHppSnapshot,
        paymentStatus: schema.orders.paymentStatus,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.paymentStatus, 'Paid'));

    const allOrders = await query;

    let filteredOrders = allOrders;
    if (fromDate) {
      filteredOrders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= fromDate! && orderDate <= toDate;
      });
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalHpp = filteredOrders.reduce((sum, o) => sum + (Number(o.totalHppSnapshot) || 0), 0);
    const totalProfit = totalRevenue - totalHpp;

    return c.json({
      totalOrders: filteredOrders.length,
      totalRevenue,
      totalHpp,
      totalProfit,
      period,
    });
  } catch (e) {
    console.error('Audit summary error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

export default audit;