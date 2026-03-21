import { useNavigationStore, type AppView } from '@/stores/navigationStore';

const views: { id: AppView; label: string }[] = [
  { id: 'habits', label: 'Habits' },
  { id: 'todos', label: 'To-dos' },
];

export function AppViewDock() {
  const { currentView, setView } = useNavigationStore();

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-1/2 z-200 -translate-x-1/2"
      aria-label="Workspace"
    >
      <div
        className="pointer-events-auto flex items-center gap-0 rounded-full border border-border/50 bg-background/35 px-2 py-0.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-background/25 dark:shadow-[0_4px_28px_rgba(0,0,0,0.35)]"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {views.map(({ id, label }, i) => {
          const active = currentView === id;
          return (
            <span key={id} className="flex items-center">
              {i > 0 && (
                <span className="mx-1 text-[10px] text-border select-none" aria-hidden>
                  |
                </span>
              )}
              <button
                type="button"
                onClick={() => setView(id)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
