import { dateStr } from '@/lib/habits';
import { Check } from 'lucide-react';
import type { Habit } from '@/lib/habits';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type WeeklyViewMode = 'today' | 'next';

interface WeeklyViewProps {
  habit: Habit;
  color: { bg: string };
  onToggleDay: (day: string) => void;
  mode?: WeeklyViewMode;
}

export function WeeklyView({ habit, color, onToggleDay, mode = 'today' }: WeeklyViewProps) {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // today = current week Sun-Sat; next = next 7 days starting tomorrow
  const startOffset = mode === 'today' ? -dayOfWeek : 1;
  const endOffset = mode === 'today' ? 6 - dayOfWeek : 7;

  const days: { label: string; dateKey: string; isToday: boolean }[] = [];
  for (let i = startOffset; i <= endOffset; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push({
      label: DAY_LABELS[d.getDay()],
      dateKey: dateStr(d),
      isToday: i === 0,
    });
  }

  return (
    <div className="flex gap-1.5 w-full">
      {days.map(({ label, dateKey, isToday }) => {
        const count = habit.completions[dateKey] || 0;
        const done = count > 0;
        return (
          <button
            key={dateKey}
            onClick={() => onToggleDay(dateKey)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md transition-colors ${
              isToday ? 'ring-1 ring-foreground/20' : ''
            } hover:bg-accent/50`}
          >
            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
              style={{
                backgroundColor: done ? `hsl(${color.bg})` : `hsl(${color.bg} / 0.1)`,
                color: done ? 'white' : `hsl(${color.bg} / 0.3)`,
              }}
            >
              {done && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
