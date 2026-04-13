import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['owner', 'staff'] }).notNull(),
  pin: text('pin').notNull(), // PIN for POS access
  createdAt: integer('created_at', { mode: 'timestamp' }).default(new Date()),
});
