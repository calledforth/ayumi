import { useState, useEffect } from 'react';
import { Minus, Square, X, Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const { themeMode, setThemeMode } = useThemeStore();

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await window.electronAPI?.windowControls.isMaximized();
        setIsMaximized(maximized ?? false);
      } catch { /* ignore */ }
    };
    checkMaximized();

    const interval = setInterval(checkMaximized, 500);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => window.electronAPI?.windowControls.minimize();
  const handleMaximize = async () => {
    await window.electronAPI?.windowControls.maximize();
    const maximized = await window.electronAPI?.windowControls.isMaximized();
    setIsMaximized(maximized ?? false);
  };
  const handleClose = () => window.electronAPI?.windowControls.close();

  const themeOptions: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'system', icon: Monitor, label: 'System' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <div
      className="h-6 flex items-center justify-end select-none shrink-0 relative"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex-1 min-h-0 min-w-0 h-full" aria-hidden />

      {/* Theme toggle + Window controls */}
      <div
        className="flex items-center h-full shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Habits-style theme toggle */}
        <div className="flex items-center rounded-full bg-muted/40 p-[3px] backdrop-blur-sm mr-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.mode}
                onClick={() => setThemeMode(opt.mode)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                  themeMode === opt.mode
                    ? 'bg-foreground text-background shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                    : 'text-muted-foreground/60 hover:text-foreground'
                }`}
                title={opt.label}
              >
                <Icon className="w-3 h-3" />
              </button>
            );
          })}
        </div>
        <div className="border-r border-border mr-1 pr-1.5 h-full" />
        <button
          onClick={handleMinimize}
          className="h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-3 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-3 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-red-500 transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
