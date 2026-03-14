import { create } from 'zustand';
import { db } from '@/services/neon';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  daily?: boolean;
  completedAt?: string;
}

export interface TodoSection {
  id: string;
  title: string;
  todos: Todo[];
  archived: boolean;
}

export interface DaySnapshotItem {
  todoId: string;
  text: string;
  completed: boolean;
  sectionTitle: string;
}

export interface DaySnapshot {
  date: string;
  items: DaySnapshotItem[];
}

export type TodoView = 'today' | 'all' | (string & {});

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ============================================================================
// DEBOUNCE UTILITY (keyed per item so timers don't cancel each other)
// ============================================================================

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedSync(key: string, fn: () => Promise<void>, ms = 500) {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      fn().catch((err) => console.error(`[Sync] debounced write failed for ${key}:`, err));
    }, ms)
  );
}

/** Fire-and-forget Neon write with error logging */
function bgSync(label: string, fn: () => Promise<void>) {
  fn().catch((err) => console.error(`[Sync] ${label} failed:`, err));
}

// ============================================================================
// STORE
// ============================================================================

interface TodoStore {
  sections: TodoSection[];
  history: DaySnapshot[];
  lastView: TodoView;
  isLoaded: boolean;

  load: () => Promise<void>;
  setLastView: (view: TodoView) => void;

  addSection: (title: string) => Promise<string>;
  updateSectionTitle: (sectionId: string, title: string) => Promise<void>;
  archiveSection: (sectionId: string) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  reorderSections: (oldIndex: number, newIndex: number) => Promise<void>;
  moveSection: (sectionId: string, direction: 'up' | 'down') => Promise<void>;

  addTodo: (sectionId: string) => Promise<string>;
  addTodoBelow: (sectionId: string, afterTodoId: string) => Promise<string>;
  updateTodo: (sectionId: string, todoId: string, text: string) => Promise<void>;
  toggleTodoCompleted: (sectionId: string, todoId: string) => Promise<void>;
  deleteTodo: (sectionId: string, todoId: string) => Promise<void>;
  toggleDaily: (sectionId: string, todoId: string) => Promise<void>;

  saveHistorySnapshot: (dateKey: string) => Promise<void>;
  getHistoryForDate: (dateKey: string) => DaySnapshotItem[];
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  sections: [],
  history: [],
  lastView: 'today',
  isLoaded: false,

  load: async () => {
    // Initialize schema (idempotent)
    await db.initialize();

    const dbSections = await db.getAllTodoSections();
    const sections: TodoSection[] = [];

    for (const s of dbSections) {
      const items = await db.getTodoItemsBySection(s.id);
      const todos: Todo[] = items.map((i: any) => ({
        id: i.id,
        text: i.text || '',
        completed: Boolean(i.completed),
        daily: Boolean(i.daily),
        completedAt: i.completedAt,
      }));
      sections.push({
        id: s.id,
        title: s.title || '',
        todos,
        archived: Boolean(s.archived),
      });
    }

    const allHistory = await db.getAllTodoHistory();
    const history: DaySnapshot[] = allHistory.map((h) => ({
      date: h.date,
      items: h.items as DaySnapshotItem[],
    }));

    // Read lastView from local settings (electron-store, not Neon)
    let lastView: TodoView = 'today';
    try {
      const stored = await window.electronAPI?.settings.get('lastTodoView');
      if (stored && typeof stored === 'string') {
        lastView = stored as TodoView;
      }
    } catch { /* ignore if not in electron */ }

    set({ sections, history, lastView, isLoaded: true });
  },

  setLastView: (view: TodoView) => {
    try {
      window.electronAPI?.settings.set('lastTodoView', view);
    } catch { /* ignore */ }
    set({ lastView: view });
  },

  addSection: async (title: string) => {
    const id = generateId();
    const now = Date.now();
    const sections = get().sections;

    // Local-first: update UI immediately
    set({
      sections: [{ id, title, todos: [], archived: false }, ...sections],
    });

    // Sync to Neon in background
    bgSync('addSection', async () => {
      await db.createTodoSection({
        id,
        title,
        sortOrder: 0,
        archived: false,
        createdAt: now,
      });
      for (let i = 0; i < sections.length; i++) {
        await db.updateTodoSection(sections[i].id, { sortOrder: i + 1 });
      }
    });

    return id;
  },

  updateSectionTitle: async (sectionId: string, title: string) => {
    // Local-first: update UI immediately
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, title } : sec
      ),
    }));

    // Debounce Neon sync (keystroke-driven)
    debouncedSync(`section-title-${sectionId}`, () =>
      db.updateTodoSection(sectionId, { title })
    );
  },

  archiveSection: async (sectionId: string) => {
    // Local-first
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, archived: true } : sec
      ),
    }));
    bgSync('archiveSection', () => db.updateTodoSection(sectionId, { archived: true }));
  },

  deleteSection: async (sectionId: string) => {
    // Local-first
    set((s) => ({
      sections: s.sections.filter((sec) => sec.id !== sectionId),
    }));
    bgSync('deleteSection', () => db.deleteTodoSection(sectionId));
  },

  reorderSections: async (oldIndex: number, newIndex: number) => {
    const { sections } = get();
    const active = sections.filter((s) => !s.archived);
    const archived = sections.filter((s) => s.archived);

    const result = [...active];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);

    const reordered = [...result, ...archived];

    // Local-first
    set({ sections: reordered });

    bgSync('reorderSections', async () => {
      for (let i = 0; i < reordered.length; i++) {
        await db.updateTodoSection(reordered[i].id, { sortOrder: i });
      }
    });
  },

  moveSection: async (sectionId: string, direction: 'up' | 'down') => {
    const { sections } = get();
    const activeIds = sections.filter((s) => !s.archived).map((s) => s.id);
    const idx = activeIds.indexOf(sectionId);
    if ((direction === 'up' && idx <= 0) || (direction === 'down' && idx >= activeIds.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    await get().reorderSections(idx, swapIdx);
  },

  addTodo: async (sectionId: string) => {
    const id = generateId();
    const now = Date.now();
    const sections = get().sections;
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return '';

    const sortOrder = section.todos.length;
    const newTodo: Todo = { id, text: '', completed: false };

    // Local-first
    set({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, todos: [...s.todos, newTodo] } : s
      ),
    });

    bgSync('addTodo', () =>
      db.createTodoItem({
        id,
        sectionId,
        text: '',
        completed: false,
        daily: false,
        sortOrder,
        createdAt: now,
      })
    );

    return id;
  },

  addTodoBelow: async (sectionId: string, afterTodoId: string) => {
    const id = generateId();
    const now = Date.now();
    const sections = get().sections;
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return '';

    const idx = section.todos.findIndex((t) => t.id === afterTodoId);
    const insertAt = idx < 0 ? section.todos.length : idx + 1;
    const newTodos = [...section.todos];
    newTodos.splice(insertAt, 0, { id, text: '', completed: false });

    // Local-first
    set({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, todos: newTodos } : s
      ),
    });

    bgSync('addTodoBelow', async () => {
      for (let i = 0; i < newTodos.length; i++) {
        const t = newTodos[i];
        if (t.id === id) {
          await db.createTodoItem({
            id,
            sectionId,
            text: '',
            completed: false,
            daily: false,
            sortOrder: i,
            createdAt: now,
          });
        } else {
          await db.updateTodoItem(t.id, { sortOrder: i });
        }
      }
    });

    return id;
  },

  updateTodo: async (sectionId: string, todoId: string, text: string) => {
    // Local-first: update UI immediately
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, todos: sec.todos.map((t) => (t.id === todoId ? { ...t, text } : t)) }
          : sec
      ),
    }));

    // Debounce Neon sync (keystroke-driven)
    debouncedSync(`todo-text-${todoId}`, () =>
      db.updateTodoItem(todoId, { text })
    );
  },

  toggleTodoCompleted: async (sectionId: string, todoId: string) => {
    const { sections } = get();
    const section = sections.find((s) => s.id === sectionId);
    const todo = section?.todos.find((t) => t.id === todoId);
    if (!todo) return;

    const completed = !todo.completed;
    const completedAt = completed ? new Date().toISOString() : undefined;

    // Local-first
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              todos: sec.todos.map((t) =>
                t.id === todoId ? { ...t, completed, completedAt } : t
              ),
            }
          : sec
      ),
    }));

    bgSync('toggleTodoCompleted', () =>
      db.updateTodoItem(todoId, { completed, completedAt })
    );

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    get().saveHistorySnapshot(todayKey);
  },

  deleteTodo: async (sectionId: string, todoId: string) => {
    // Local-first
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, todos: sec.todos.filter((t) => t.id !== todoId) }
          : sec
      ),
    }));
    bgSync('deleteTodo', () => db.deleteTodoItem(todoId));
  },

  toggleDaily: async (sectionId: string, todoId: string) => {
    const { sections } = get();
    const todo = sections.flatMap((s) => s.todos).find((t) => t.id === todoId);
    if (!todo) return;

    const daily = !(todo.daily ?? false);

    // Local-first
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, todos: sec.todos.map((t) => (t.id === todoId ? { ...t, daily } : t)) }
          : sec
      ),
    }));

    bgSync('toggleDaily', () => db.updateTodoItem(todoId, { daily }));

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    get().saveHistorySnapshot(todayKey);
  },

  saveHistorySnapshot: async (dateKey: string) => {
    const { sections } = get();
    const dailyItems: DaySnapshotItem[] = sections.flatMap((s) =>
      s.todos
        .filter((t) => t.daily)
        .map((t) => ({
          todoId: t.id,
          text: t.text,
          completed: t.completed,
          sectionTitle: s.title,
        }))
    );

    // Local-first
    set((s) => {
      const history = [...s.history];
      const idx = history.findIndex((h) => h.date === dateKey);
      const entry = { date: dateKey, items: dailyItems };
      if (idx >= 0) history[idx] = entry;
      else history.push(entry);
      history.sort((a, b) => b.date.localeCompare(a.date));
      return { history };
    });

    bgSync('saveHistorySnapshot', () => db.saveTodoHistory(dateKey, dailyItems));
  },

  getHistoryForDate: (dateKey: string) => {
    const entry = get().history.find((h) => h.date === dateKey);
    return entry?.items ?? [];
  },
}));
