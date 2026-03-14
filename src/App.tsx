import { useEffect, useRef } from 'react';
import { Titlebar } from './components/titlebar/Titlebar';
import { HabitTracker } from './components/habits/HabitTracker';
import { TodoWorkspace } from './components/todo/TodoWorkspace';
import { useNavigationStore, type AppView } from './stores/navigationStore';
import { useThemeStore, applyTheme } from './stores/themeStore';

const VIEW_ORDER: AppView[] = ['habits', 'todos'];

export default function App() {
  const { currentView, setView } = useNavigationStore();
  const { themeMode } = useThemeStore();
  const pagerRef = useRef<HTMLDivElement>(null);
  const fromScrollRef = useRef(false);

  // Apply theme (habits-style: light/system/dark)
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  // Re-apply when system preference changes (for themeMode === 'system')
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [themeMode]);

  // When currentView changes from tab click, scroll pager to match.
  // Skip when the change came from a user swipe (to avoid fighting native scroll).
  useEffect(() => {
    if (fromScrollRef.current) {
      fromScrollRef.current = false;
      return;
    }
    const el = pagerRef.current;
    if (!el) return;
    const index = VIEW_ORDER.indexOf(currentView);
    const targetScrollLeft = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - targetScrollLeft) > 1) {
      el.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    }
  }, [currentView]);

  // Sync currentView when user swipes (scroll event from native scroll)
  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const width = el.clientWidth;
      const scrollLeft = el.scrollLeft;
      const index = Math.round(scrollLeft / width);
      const view = VIEW_ORDER[Math.max(0, Math.min(index, VIEW_ORDER.length - 1))];
      if (view && view !== useNavigationStore.getState().currentView) {
        fromScrollRef.current = true;
        setView(view);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [setView]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden transition-colors">
      <Titlebar />

      {/* CSS Scroll Snap view pager — native swipe, content follows finger */}
      <div ref={pagerRef} className="view-pager flex-1 min-h-0">
        <div className="view-page">
          <HabitTracker />
        </div>
        <div className="view-page">
          <TodoWorkspace />
        </div>
      </div>
    </div>
  );
}
