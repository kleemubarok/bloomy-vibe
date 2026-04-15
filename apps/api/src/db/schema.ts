import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

// --- AUTH & USERS ---

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['superadmin', 'owner', 'staff'] }).notNull(),
  pin: text('pin').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

// --- INVENTORY & PRODUCTS ---

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  unit: text('unit').notNull(), // e.g., 'tangkai', 'meter', 'pcs'
  stockLevel: real('stock_level').notNull().default(0),
  reorderLevel: real('reorder_level').notNull().default(5),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  skuIdx: index('inventory_sku_idx').on(table.sku),
}));

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(), // e.g., 'flower', 'service', 'craft'
  basePrice: integer('base_price').notNull(), // In whole Rupiah (integer)
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  slugIdx: index('products_slug_idx').on(table.slug),
  categoryIdx: index('products_category_idx').on(table.category),
}));

export const productRecipes = sqliteTable('product_recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  inventoryId: integer('inventory_id').notNull().references(() => inventory.id),
  quantityRequired: real('quantity_required').notNull(),
});

// --- TRANSACTIONS ---

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  customerName: text('customer_name').notNull(),
  customerWhatsapp: text('customer_whatsapp'),
  totalAmount: integer('total_amount').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  status: text('status', { enum: ['Draft', 'Antri', 'Dirangkai', 'Selesai', 'Diambil', 'Dikirim', 'Batal'] }).notNull().default('Antri'),
  paymentStatus: text('payment_status', { enum: ['Pending', 'Paid', 'Partial', 'Refunded'] }).notNull().default('Pending'),
  orderType: text('order_type', { enum: ['POS', 'Self-Order'] }).notNull().default('POS'),
  
  // Self-order & specific details
  deliveryDate: integer('delivery_date', { mode: 'timestamp' }),
  messageCard: text('message_card'),
  senderName: text('sender_name'),
  
  // Snapshots for financial reporting (Issue #7 requirements)
  totalHppSnapshot: integer('total_hpp_snapshot'), // Total cost of goods at time of order
  priceLockedAt: integer('price_locked_at', { mode: 'timestamp' }),
  
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  whatsappIdx: index('orders_whatsapp_idx').on(table.customerWhatsapp),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
}));

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPriceAtOrder: integer('unit_price_at_order').notNull(),
  notes: text('notes'),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id').notNull().references(() => orders.id),
  method: text('method', { enum: ['Cash', 'QRIS', 'Transfer'] }).notNull(),
  amount: integer('amount').notNull(),
  reference: text('reference'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

// --- LOGS & SYNC ---

export const inventoryLog = sqliteTable('inventory_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  inventoryId: integer('inventory_id').notNull().references(() => inventory.id),
  changeQty: real('change_qty').notNull(),
  reason: text('reason').notNull(), // e.g., 'Restock', 'Order Sale', 'Adjustment', 'Damage'
  orderId: text('order_id').references(() => orders.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  entityType: text('entity_type').notNull(), // e.g., 'orders', 'payments'
  entityId: text('entity_id').notNull(),
  operation: text('operation', { enum: ['INSERT', 'UPDATE', 'DELETE'] }).notNull(),
  payload: text('payload').notNull(), // JSON string
  status: text('status', { enum: ['Pending', 'Processing', 'Synced', 'Failed'] }).notNull().default('Pending'),
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  statusIdx: index('sync_queue_status_idx').on(table.status),
}));

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
}));
