import { neon } from '@neondatabase/serverless';

// ============================================================================
// NEON DATABASE SERVICE
// ============================================================================
// Reads VITE_DATABASE_URL from environment.
// Usage: import { db } from '@/services/neon';
//        const rows = await db.getAllTodoSections();
// ============================================================================

function getConnectionString(): string {
  const url = import.meta.env.VITE_DATABASE_URL;
  if (!url) {
    throw new Error(
      '[Neon] VITE_DATABASE_URL is not set. ' +
      'Create a .env file with VITE_DATABASE_URL=postgresql://...'
    );
  }
  return url;
}

function getSql() {
  return neon(getConnectionString());
}

// ============================================================================
// SCHEMA INITIALIZATION
// ============================================================================

export async function initializeDatabase(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS todo_sections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      archived BOOLEAN NOT NULL DEFAULT false,
      created_at BIGINT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES todo_sections(id) ON DELETE CASCADE,
      text TEXT NOT NULL DEFAULT '',
      completed BOOLEAN NOT NULL DEFAULT false,
      daily BOOLEAN NOT NULL DEFAULT false,
      completed_at TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS todo_history (
      date TEXT PRIMARY KEY,
      items JSONB NOT NULL DEFAULT '[]'
    )
  `;

  console.log('[Neon] Database schema initialized');
}

// ============================================================================
// TODO SECTIONS
// ============================================================================

export async function getAllTodoSections() {
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, sort_order, archived, created_at
    FROM todo_sections
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    sortOrder: r.sort_order,
    archived: r.archived,
    createdAt: Number(r.created_at),
  }));
}

export async function createTodoSection(section: {
  id: string;
  title: string;
  sortOrder: number;
  archived: boolean;
  createdAt: number;
}) {
  const sql = getSql();
  await sql`
    INSERT INTO todo_sections (id, title, sort_order, archived, created_at)
    VALUES (${section.id}, ${section.title}, ${section.sortOrder}, ${section.archived}, ${section.createdAt})
  `;
}

export async function updateTodoSection(
  id: string,
  updates: { title?: string; sortOrder?: number; archived?: boolean }
) {
  const sql = getSql();
  // Build dynamic update — Neon tagged template doesn't support dynamic column names,
  // so we do a full update with COALESCE-style logic
  const current = await sql`SELECT * FROM todo_sections WHERE id = ${id}`;
  if (current.length === 0) return;

  const row = current[0];
  const title = updates.title ?? row.title;
  const sortOrder = updates.sortOrder ?? row.sort_order;
  const archived = updates.archived ?? row.archived;

  await sql`
    UPDATE todo_sections
    SET title = ${title}, sort_order = ${sortOrder}, archived = ${archived}
    WHERE id = ${id}
  `;
}

export async function deleteTodoSection(id: string) {
  const sql = getSql();
  await sql`DELETE FROM todo_sections WHERE id = ${id}`;
}

// ============================================================================
// TODO ITEMS
// ============================================================================

export async function getTodoItemsBySection(sectionId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, section_id, text, completed, daily, completed_at, sort_order, created_at
    FROM todo_items
    WHERE section_id = ${sectionId}
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map((r: any) => ({
    id: r.id,
    sectionId: r.section_id,
    text: r.text,
    completed: r.completed,
    daily: r.daily,
    completedAt: r.completed_at,
    sortOrder: r.sort_order,
    createdAt: Number(r.created_at),
  }));
}

export async function createTodoItem(item: {
  id: string;
  sectionId: string;
  text: string;
  completed: boolean;
  daily: boolean;
  completedAt?: string | null;
  sortOrder: number;
  createdAt: number;
}) {
  const sql = getSql();
  await sql`
    INSERT INTO todo_items (id, section_id, text, completed, daily, completed_at, sort_order, created_at)
    VALUES (${item.id}, ${item.sectionId}, ${item.text}, ${item.completed}, ${item.daily}, ${item.completedAt ?? null}, ${item.sortOrder}, ${item.createdAt})
  `;
}

export async function updateTodoItem(
  id: string,
  updates: { text?: string; completed?: boolean; daily?: boolean; completedAt?: string | null; sortOrder?: number }
) {
  const sql = getSql();
  const current = await sql`SELECT * FROM todo_items WHERE id = ${id}`;
  if (current.length === 0) return;

  const row = current[0];
  const text = updates.text ?? row.text;
  const completed = updates.completed ?? row.completed;
  const daily = updates.daily ?? row.daily;
  const completedAt = updates.completedAt !== undefined ? updates.completedAt : row.completed_at;
  const sortOrder = updates.sortOrder ?? row.sort_order;

  await sql`
    UPDATE todo_items
    SET text = ${text}, completed = ${completed}, daily = ${daily},
        completed_at = ${completedAt}, sort_order = ${sortOrder}
    WHERE id = ${id}
  `;
}

export async function deleteTodoItem(id: string) {
  const sql = getSql();
  await sql`DELETE FROM todo_items WHERE id = ${id}`;
}

// ============================================================================
// TODO HISTORY
// ============================================================================

export async function getTodoHistory(dateKey: string) {
  const sql = getSql();
  const rows = await sql`SELECT items FROM todo_history WHERE date = ${dateKey}`;
  if (rows.length === 0) return [];
  return rows[0].items as any[];
}

export async function getAllTodoHistory(): Promise<{ date: string; items: any[] }[]> {
  const sql = getSql();
  const rows = await sql`SELECT date, items FROM todo_history ORDER BY date DESC`;
  return rows.map((r: any) => ({ date: r.date, items: r.items }));
}

export async function saveTodoHistory(dateKey: string, items: any[]) {
  const sql = getSql();
  await sql`
    INSERT INTO todo_history (date, items)
    VALUES (${dateKey}, ${JSON.stringify(items)}::jsonb)
    ON CONFLICT (date)
    DO UPDATE SET items = ${JSON.stringify(items)}::jsonb
  `;
}

// Convenience export
export const db = {
  initialize: initializeDatabase,
  getAllTodoSections,
  createTodoSection,
  updateTodoSection,
  deleteTodoSection,
  getTodoItemsBySection,
  createTodoItem,
  updateTodoItem,
  deleteTodoItem,
  getTodoHistory,
  getAllTodoHistory,
  saveTodoHistory,
};
