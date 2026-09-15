import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const activityEvents = sqliteTable(
  'activity_events',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    action: text('action').notNull(),
    reportId: text('report_id').notNull().default(''),
    client: text('client').notNull().default(''),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('idx_activity_time').on(table.createdAt),
    index('idx_activity_user_action_report_time').on(
      table.email,
      table.action,
      table.reportId,
      table.createdAt,
    ),
    index('idx_activity_report_time').on(table.reportId, table.createdAt),
  ],
);

export const dailys = sqliteTable(
  'dailys',
  {
    id: text('id').primaryKey(),
    client: text('client').notNull(),
    city: text('city').notNull().default(''),
    state: text('state').notNull().default(''),
    plan: text('plan').notNull().default(''),
    endDate: text('end_date').notNull().default(''),
    payload: text('payload').notNull(),
    audioKey: text('audio_key'),
    createdBy: text('created_by').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('idx_dailys_created_at').on(table.createdAt),
    index('idx_dailys_client_location').on(
      table.client,
      table.city,
      table.state,
    ),
  ],
);

export const permissions = sqliteTable('permissions', {
  email: text('email').primaryKey(),
  canEdit: integer('can_edit', { mode: 'boolean' }).notNull().default(false),
  canDelete: integer('can_delete', { mode: 'boolean' })
    .notNull()
    .default(false),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  updatedAt: integer('updated_at').notNull(),
});
