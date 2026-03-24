import { neon } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const neonUrl = required('NEON_DATABASE_URL');
const supabaseUrl = required('SUPABASE_URL');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');

const sql = neon(neonUrl);
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function readNeon() {
  const sections = await sql`
    SELECT id, title, sort_order, archived, created_at
    FROM todo_sections
    ORDER BY sort_order ASC, created_at ASC
  `;
  const items = await sql`
    SELECT id, section_id, text, completed, daily, completed_at, sort_order, created_at
    FROM todo_items
    ORDER BY sort_order ASC, created_at ASC
  `;
  const history = await sql`
    SELECT date, items
    FROM todo_history
    ORDER BY date DESC
  `;
  return { sections, items, history };
}

async function upsertSupabase({ sections, items, history }) {
  const sectionRows = sections.map((row) => ({
    id: row.id,
    title: row.title,
    sort_order: row.sort_order,
    archived: row.archived,
    created_at: Number(row.created_at),
  }));
  const itemRows = items.map((row) => ({
    id: row.id,
    section_id: row.section_id,
    text: row.text,
    completed: row.completed,
    daily: row.daily,
    completed_at: row.completed_at,
    sort_order: row.sort_order,
    created_at: Number(row.created_at),
  }));
  const historyRows = history.map((row) => ({
    date: row.date,
    items: row.items,
  }));

  if (sectionRows.length > 0) {
    const { error } = await supabase.from('todo_sections').upsert(sectionRows, { onConflict: 'id' });
    if (error) throw error;
  }
  if (itemRows.length > 0) {
    const { error } = await supabase.from('todo_items').upsert(itemRows, { onConflict: 'id' });
    if (error) throw error;
  }
  if (historyRows.length > 0) {
    const { error } = await supabase.from('todo_history').upsert(historyRows, { onConflict: 'date' });
    if (error) throw error;
  }
}

async function main() {
  const data = await readNeon();
  await upsertSupabase(data);
  console.log(
    `[migrate-neon-to-supabase] Migrated ${data.sections.length} sections, ${data.items.length} items, ${data.history.length} history rows.`
  );
}

main().catch((err) => {
  console.error('[migrate-neon-to-supabase] Failed:', err);
  process.exitCode = 1;
});
