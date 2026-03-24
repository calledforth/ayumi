// ============================================================================
// REMOTE TODO SERVICE (Vercel API)
// ============================================================================
// Usage remains the same for store consumers:
//   import { db } from '@/services/neon';
// This keeps the migration surface small while moving DB access server-side.
// ============================================================================

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      '[API] VITE_API_BASE_URL is not set. ' +
      'Create a .env file with VITE_API_BASE_URL=https://your-app.vercel.app'
    );
  }
  return baseUrl.replace(/\/+$/, '');
}

async function callTodoApi<T = unknown>(action: string, payload?: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api/todo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  let data: { data?: T; error?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    // no-op
  }

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return (data?.data ?? null) as T;
}

export async function initializeDatabase(): Promise<void> {
  await callTodoApi('initialize');
}

export async function getAllTodoSections() {
  return callTodoApi<any[]>('getAllTodoSections');
}

export async function createTodoSection(section: {
  id: string;
  title: string;
  sortOrder: number;
  archived: boolean;
  createdAt: number;
}) {
  await callTodoApi('createTodoSection', section);
}

export async function updateTodoSection(
  id: string,
  updates: { title?: string; sortOrder?: number; archived?: boolean }
) {
  await callTodoApi('updateTodoSection', { id, updates });
}

export async function deleteTodoSection(id: string) {
  await callTodoApi('deleteTodoSection', { id });
}

export async function getTodoItemsBySection(sectionId: string) {
  return callTodoApi<any[]>('getTodoItemsBySection', { sectionId });
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
  await callTodoApi('createTodoItem', item);
}

export async function updateTodoItem(
  id: string,
  updates: { text?: string; completed?: boolean; daily?: boolean; completedAt?: string | null; sortOrder?: number }
) {
  await callTodoApi('updateTodoItem', { id, updates });
}

export async function deleteTodoItem(id: string) {
  await callTodoApi('deleteTodoItem', { id });
}

export async function getTodoHistory(dateKey: string) {
  return callTodoApi<any[]>('getTodoHistory', { dateKey });
}

export async function getAllTodoHistory(): Promise<{ date: string; items: any[] }[]> {
  return callTodoApi('getAllTodoHistory');
}

export async function saveTodoHistory(dateKey: string, items: any[]) {
  await callTodoApi('saveTodoHistory', { dateKey, items });
}

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
