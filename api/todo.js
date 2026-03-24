const { getSupabaseAdmin } = require('./_lib/supabase');
const { applyCors, handleOptions, sendJson } = require('./_lib/http');

function mapSectionRow(row) {
  return {
    id: row.id,
    title: row.title,
    sortOrder: row.sort_order,
    archived: row.archived,
    createdAt: Number(row.created_at),
  };
}

function mapItemRow(row) {
  return {
    id: row.id,
    sectionId: row.section_id,
    text: row.text,
    completed: row.completed,
    daily: row.daily,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    createdAt: Number(row.created_at),
  };
}

async function getSectionById(supabase, id) {
  const { data, error } = await supabase.from('todo_sections').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getItemById(supabase, id) {
  const { data, error } = await supabase.from('todo_items').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getSections(supabase) {
  const { data, error } = await supabase
    .from('todo_sections')
    .select('id,title,sort_order,archived,created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapSectionRow);
}

async function createSection(supabase, payload) {
  const row = {
    id: payload.id,
    title: payload.title,
    sort_order: payload.sortOrder ?? 0,
    archived: Boolean(payload.archived),
    created_at: payload.createdAt,
  };
  const { error } = await supabase.from('todo_sections').insert(row);
  if (error) throw error;
}

async function updateSection(supabase, payload) {
  const existing = await getSectionById(supabase, payload.id);
  if (!existing) return;
  const updates = {
    title: payload.updates?.title ?? existing.title,
    sort_order: payload.updates?.sortOrder ?? existing.sort_order,
    archived: payload.updates?.archived ?? existing.archived,
  };
  const { error } = await supabase.from('todo_sections').update(updates).eq('id', payload.id);
  if (error) throw error;
}

async function deleteSection(supabase, payload) {
  const { error } = await supabase.from('todo_sections').delete().eq('id', payload.id);
  if (error) throw error;
}

async function getItemsBySection(supabase, payload) {
  const { data, error } = await supabase
    .from('todo_items')
    .select('id,section_id,text,completed,daily,completed_at,sort_order,created_at')
    .eq('section_id', payload.sectionId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapItemRow);
}

async function createItem(supabase, payload) {
  const row = {
    id: payload.id,
    section_id: payload.sectionId,
    text: payload.text ?? '',
    completed: Boolean(payload.completed),
    daily: Boolean(payload.daily),
    completed_at: payload.completedAt ?? null,
    sort_order: payload.sortOrder ?? 0,
    created_at: payload.createdAt,
  };
  const { error } = await supabase.from('todo_items').insert(row);
  if (error) throw error;
}

async function updateItem(supabase, payload) {
  const existing = await getItemById(supabase, payload.id);
  if (!existing) return;
  const updates = {
    text: payload.updates?.text ?? existing.text,
    completed: payload.updates?.completed ?? existing.completed,
    daily: payload.updates?.daily ?? existing.daily,
    completed_at:
      payload.updates && Object.prototype.hasOwnProperty.call(payload.updates, 'completedAt')
        ? payload.updates.completedAt
        : existing.completed_at,
    sort_order: payload.updates?.sortOrder ?? existing.sort_order,
  };
  const { error } = await supabase.from('todo_items').update(updates).eq('id', payload.id);
  if (error) throw error;
}

async function deleteItem(supabase, payload) {
  const { error } = await supabase.from('todo_items').delete().eq('id', payload.id);
  if (error) throw error;
}

async function getTodoHistory(supabase, payload) {
  const { data, error } = await supabase
    .from('todo_history')
    .select('items')
    .eq('date', payload.dateKey)
    .maybeSingle();
  if (error) throw error;
  return data?.items ?? [];
}

async function getAllTodoHistory(supabase) {
  const { data, error } = await supabase
    .from('todo_history')
    .select('date,items')
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map((row) => ({ date: row.date, items: row.items }));
}

async function saveTodoHistory(supabase, payload) {
  const { error } = await supabase.from('todo_history').upsert(
    {
      date: payload.dateKey,
      items: payload.items ?? [],
    },
    { onConflict: 'date' }
  );
  if (error) throw error;
}

async function ensureSchema(supabase) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS todo_sections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      archived BOOLEAN NOT NULL DEFAULT false,
      created_at BIGINT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES todo_sections(id) ON DELETE CASCADE,
      text TEXT NOT NULL DEFAULT '',
      completed BOOLEAN NOT NULL DEFAULT false,
      daily BOOLEAN NOT NULL DEFAULT false,
      completed_at TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS todo_history (
      date TEXT PRIMARY KEY,
      items JSONB NOT NULL DEFAULT '[]'
    )`,
  ];
  for (const query of queries) {
    const { error } = await supabase.rpc('exec_sql', { query_text: query });
    if (error) {
      // Keeping this endpoint safe in cases where rpc is not configured.
      return;
    }
  }
}

const actionHandlers = {
  initialize: async (supabase) => {
    await ensureSchema(supabase);
    return { ok: true };
  },
  getAllTodoSections: getSections,
  createTodoSection: createSection,
  updateTodoSection: updateSection,
  deleteTodoSection: deleteSection,
  getTodoItemsBySection: getItemsBySection,
  createTodoItem: createItem,
  updateTodoItem: updateItem,
  deleteTodoItem: deleteItem,
  getTodoHistory,
  getAllTodoHistory,
  saveTodoHistory,
};

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { action, payload } = req.body || {};
    if (!action || typeof action !== 'string') {
      return sendJson(res, 400, { error: 'Missing action' });
    }

    const handlerFn = actionHandlers[action];
    if (!handlerFn) {
      return sendJson(res, 400, { error: `Unsupported action: ${action}` });
    }

    const supabase = getSupabaseAdmin();
    const result = await handlerFn(supabase, payload || {});
    return sendJson(res, 200, { data: result ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return sendJson(res, 500, { error: message });
  }
};
