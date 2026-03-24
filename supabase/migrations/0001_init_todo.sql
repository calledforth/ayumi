    -- Ayumi initial todo schema for Supabase Postgres
    -- Mirrors existing Neon structure used by the app.
    
    create table if not exists public.todo_sections (
    id text primary key,
    title text not null,
    sort_order integer not null default 0,
    archived boolean not null default false,
    created_at bigint not null
    );
    
    create table if not exists public.todo_items (
    id text primary key,
    section_id text not null references public.todo_sections(id) on delete cascade,
    text text not null default '',
    completed boolean not null default false,
    daily boolean not null default false,
    completed_at text,
    sort_order integer not null default 0,
    created_at bigint not null
    );
    
    create table if not exists public.todo_history (
    date text primary key,
    items jsonb not null default '[]'::jsonb
    );
    
    create index if not exists idx_todo_sections_sort_order on public.todo_sections(sort_order);
    create index if not exists idx_todo_items_section_sort on public.todo_items(section_id, sort_order);
    
    -- Realtime publication support (idempotent)
    do $$
    begin
    alter publication supabase_realtime add table public.todo_sections;
    exception
    when duplicate_object then null;
    end $$;
    
    do $$
    begin
    alter publication supabase_realtime add table public.todo_items;
    exception
    when duplicate_object then null;
    end $$;
    
    do $$
    begin
    alter publication supabase_realtime add table public.todo_history;
    exception
    when duplicate_object then null;
    end $$;
    
    -- Required for full update/delete payloads in Realtime
    alter table public.todo_sections replica identity full;
    alter table public.todo_items replica identity full;
    alter table public.todo_history replica identity full;
    
    -- Keep RLS enabled; policies should be added based on selected auth model.
    alter table public.todo_sections enable row level security;
    alter table public.todo_items enable row level security;
    alter table public.todo_history enable row level security;
