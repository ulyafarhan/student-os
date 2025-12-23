import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Definisi Tabel Transaksi
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  type: text('type').notNull(),
  category: text('category').default('Uncategorized'),
  date: text('date').notNull(),
  synced: integer('synced', { mode: 'boolean' }).default(false),
});

// TYPE EXPORTS
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;