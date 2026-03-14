import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// THEME — light, system, dark (habits-style)
// ============================================================================

export type ThemeMode = 'light' | 'system' | 'dark';

interface ThemeStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

// Custom storage adapter for electron-store persistence
const electronStorage = {
  getItem: async (name: string) => {
    try {
      const value = await window.electronAPI?.settings.get(name);
      return value;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await window.electronAPI?.settings.set(name, value);
    } catch { /* ignore */ }
  },
  removeItem: async (name: string) => {
    try {
      await window.electronAPI?.settings.delete(name);
    } catch { /* ignore */ }
  },
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'ayumi-theme',
      storage: createJSONStorage(() => electronStorage),
    }
  )
);

// Apply theme as .dark class on document root
export function applyTheme(themeMode: ThemeMode) {
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark);
  }
}
