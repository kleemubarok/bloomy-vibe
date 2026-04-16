import { eq, and, gt, lt } from 'drizzle-orm';
import * as schema from '../db/schema';
import type { Bindings } from '../db/client';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export type SyncOperation = {
  id: string;
  entityType: 'orders' | 'order_items' | 'payments' | 'inventory' | 'inventory_log';
  entityId?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number;
};

export type SyncResult = {
  synced: { localId: string; serverId: string }[];
  failed: { localId: string; error: string }[];
};

export async function processBatchSync(
  db: DrizzleD1Database,
  operations: SyncOperation[]
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: [],
    failed: [],
  };

  for (const op of operations) {
    try {
      const syncResult = await processSyncOperation(db, op);
      
      if (syncResult.success) {
        result.synced.push({
          localId: op.id,
          serverId: syncResult.serverId || op.id,
        });
      } else {
        result.failed.push({
          localId: op.id,
          error: syncResult.error || 'Unknown error',
        });
      }
    } catch (error: any) {
      result.failed.push({
        localId: op.id,
        error: error.message || 'Unknown error',
      });
    }
  }

  return result;
}

async function processSyncOperation(
  db: DrizzleD1Database,
  op: SyncOperation
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  switch (op.entityType) {
    case 'orders':
      return processOrderSync(db, op);
    case 'order_items':
      return processOrderItemSync(db, op);
    case 'payments':
      return processPaymentSync(db, op);
    default:
      return { success: false, error: `Unsupported entity type: ${op.entityType}` };
  }
}

async function processOrderSync(
  db: DrizzleD1Database,
  op: SyncOperation
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  switch (op.operation) {
    case 'INSERT':
      return insertOrder(db, op);
    case 'UPDATE':
      return updateOrder(db, op);
    case 'DELETE':
      return deleteOrder(db, op);
    default:
      return { success: false, error: 'Unknown operation' };
  }
}

async function insertOrder(
  db: DrizzleD1Database,
  op: SyncOperation
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  const existing = op.entityId 
    ? await db.select().from(schema.orders).where(eq(schema.orders.id, op.entityId)).limit(1)
    : [];

  if (existing.length > 0) {
    const lastWriteWin = await lastWriteWins(
      db,
      schema.orders,
      eq(schema.orders.id, existing[0].id),
      op.timestamp
    );

    if (lastWriteWin) {
      await db.update(schema.orders)
        .set({
          ...op.payload,
          updatedAt: new Date(),
          isSynced: true,
        } as any)
        .where(eq(schema.orders.id, existing[0].id));
      
      return { success: true, serverId: existing[0].id };
    }
    return { success: true, serverId: existing[0].id };
  }

  const [newOrder] = await db.insert(schema.orders).values({
    id: op.entityId || undefined,
    customerName: op.payload.customerName as string,
    customerWhatsapp: op.payload.customerWhatsapp as string | undefined,
    totalAmount: op.payload.totalAmount as number || 0,
    discountAmount: op.payload.discountAmount as number || 0,
    status: op.payload.status as any || 'Antri',
    paymentStatus: op.payload.paymentStatus as any || 'Pending',
    orderType: op.payload.orderType as any || 'POS',
    deliveryDate: op.payload.deliveryDate ? new Date(op.payload.deliveryDate as string) : undefined,
    messageCard: op.payload.messageCard as string | undefined,
    senderName: op.payload.senderName as string | undefined,
    isSynced: true,
  }).returning();

  return { success: true, serverId: newOrder?.id };
}

async function updateOrder(
  db: DrizzleD1Database,
  op: SyncOperation
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  if (!op.entityId) {
    return { success: false, error: 'entityId required for UPDATE' };
  }

  const [existing] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, op.entityId))
    .limit(1);

  if (!existing) {
    return { success: false, error: 'Order not found' };
  }

  await db.update(schema.orders)
    .set({
      ...op.payload,
      updatedAt: new Date(),
      isSynced: true,
    } as any)
    .where(eq(schema.orders.id, op.entityId));

  return { success: true, serverId: op.entityId };
}

async function deleteOrder(
  db: DrizzleD1Database,
  op: SyncOperation
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  if (!op.entityId) {
    return { success: false, error: 'entityId required for DELETE' };
  }

  await db.update(schema.orders)
    .set({ status: 'Batal', updatedAt: new Date() })
    .where(eq(schema.orders.id, op.entityId));

  return { success: true, serverId: op.entityId };
}

async function processOrderItemSync(
  db: DrizzleD1Database,
  op: SyncOperation
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  switch (op.operation) {
    case 'INSERT':
      const [newItem] = await db.insert(schema.orderItems).values({
        orderId: op.payload.orderId as string,
        productId: op.payload.productId as number,
        quantity: op.payload.quantity as number,
        unitPriceAtOrder: op.payload.unitPriceAtOrder as number,
        notes: op.payload.notes as string | undefined,
      }).returning();
      return { success: true, serverId: newItem?.id.toString() };

    case 'UPDATE':
      if (!op.entityId) {
        return { success: false, error: 'entityId required for UPDATE' };
      }
      await db.update(schema.orderItems)
        .set(op.payload as any)
        .where(eq(schema.orderItems.id, parseInt(op.entityId)));
      return { success: true, serverId: op.entityId };

    case 'DELETE':
      if (!op.entityId) {
        return { success: false, error: 'entityId required for DELETE' };
      }
      await db.delete(schema.orderItems)
        .where(eq(schema.orderItems.id, parseInt(op.entityId)));
      return { success: true, serverId: op.entityId };

    default:
      return { success: false, error: 'Unknown operation' };
  }
}

async function processPaymentSync(
  db: DrizzleD1Database,
  op: SyncOperation
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  switch (op.operation) {
    case 'INSERT':
      const [newPayment] = await db.insert(schema.payments).values({
        orderId: op.payload.orderId as string,
        method: op.payload.method as 'Cash' | 'QRIS' | 'Transfer',
        amount: op.payload.amount as number,
        reference: op.payload.reference as string | undefined,
      }).returning();
      return { success: true, serverId: newPayment?.id.toString() };

    case 'UPDATE':
      if (!op.entityId) {
        return { success: false, error: 'entityId required for UPDATE' };
      }
      await db.update(schema.payments)
        .set(op.payload as any)
        .where(eq(schema.payments.id, parseInt(op.entityId)));
      return { success: true, serverId: op.entityId };

    default:
      return { success: false, error: 'Unknown operation' };
  }
}

async function lastWriteWins<T extends { updatedAt: Date | null }>(
  db: DrizzleD1Database,
  table: any,
  condition: any,
  incomingTimestamp: number
): Promise<boolean> {
  const [record] = await db.select().from(table).where(condition).limit(1);

  if (!record || !record.updatedAt) {
    return true;
  }

  const serverTimestamp = new Date(record.updatedAt).getTime();
  return incomingTimestamp > serverTimestamp;
}
