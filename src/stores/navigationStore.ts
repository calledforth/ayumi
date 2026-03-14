import { create } from 'zustand';

export type AppView = 'habits' | 'todos';

interface NavigationStore {
  currentView: AppView;
  setView: (view: AppView) => void;
  swipeLeft: () => void;
  swipeRight: () => void;
}

// View order for gesture navigation: habits <-> todos
const VIEW_ORDER: AppView[] = ['habits', 'todos'];

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  currentView: 'habits',

  setView: (view) => set({ currentView: view }),

  swipeLeft: () => {
    const current = get().currentView;
    const idx = VIEW_ORDER.indexOf(current);
    if (idx < VIEW_ORDER.length - 1) {
      set({ currentView: VIEW_ORDER[idx + 1] });
    }
  },

  swipeRight: () => {
    const current = get().currentView;
    const idx = VIEW_ORDER.indexOf(current);
    if (idx > 0) {
      set({ currentView: VIEW_ORDER[idx - 1] });
    }
  },
}));
