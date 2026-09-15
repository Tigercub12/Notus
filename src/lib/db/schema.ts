import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // uuid
  email: text('email').notNull().unique(),
  password_hash: text('password_hash'),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  is_pinned: integer('is_pinned').notNull().default(0), // 0 or 1
  is_archived: integer('is_archived').notNull().default(0),
  canvas_image_url: text('canvas_image_url'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#000000'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}, (table) => {
  return {
    userNameUnique: uniqueIndex('tags_user_name_unique').on(table.user_id, table.name),
  };
});

export const noteTags = sqliteTable('note_tags', {
  note_id: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tag_id: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.note_id, table.tag_id] }),
  };
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  event_date: text('event_date').notNull(), // ISO8601 string
  end_date: text('end_date'), // ISO8601 string
  recurrence_rule: text('recurrence_rule'),
  is_notified: integer('is_notified').notNull().default(0),
  note_id: text('note_id').references(() => notes.id, { onDelete: 'set null' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  note_id: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  r2_key: text('r2_key').notNull(),
  file_name: text('file_name').notNull(),
  mime_type: text('mime_type'),
  size_bytes: integer('size_bytes'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
