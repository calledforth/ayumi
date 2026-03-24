import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

function getRealtimeConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getClient() {
  if (supabaseClient) return supabaseClient;
  const config = getRealtimeConfig();
  if (!config) return null;
  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return supabaseClient;
}

export function initializeTodoRealtime(onChange: () => void) {
  const client = getClient();
  if (!client) return () => {};

  if (realtimeChannel) {
    void client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  const onAnyChange = () => onChange();
  const channel = client.channel('todo-changes');
  channel
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'todo_sections' },
      onAnyChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'todo_items' },
      onAnyChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'todo_history' },
      onAnyChange
    )
    .subscribe();

  realtimeChannel = channel;

  return () => {
    if (!realtimeChannel) return;
    void client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  };
}
