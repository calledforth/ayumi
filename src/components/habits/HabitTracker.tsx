import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, CalendarDays } from 'lucide-react';
import {
  Habit,
  loadHabits,
  saveHabits,
  createHabit,
  todayStr,
} from '@/lib/habits';
import { HabitCard } from './HabitCard';
import { AddHabitDialog } from './AddHabitDialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { WeeklyViewMode } from './WeeklyView';

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(loadHabits);
  const [viewMode, setViewMode] = useState<'overview' | 'weekly'>('overview');
  const [weeklyViewMode, setWeeklyViewMode] = useState<WeeklyViewMode>('today');

  const persist = useCallback((updated: Habit[]) => {
    setHabits(updated);
    saveHabits(updated);
  }, []);

  const handleAdd = (
    name: string,
    icon: import('@/lib/habits').HabitIconName,
    color: number,
    goalType: 'daily' | 'weekly',
    goalCount: number
  ) => {
    persist([...habits, createHabit(name, icon, color, goalType, goalCount)]);
  };

  const handleComplete = (habitId: string) => {
    const today = todayStr();
    persist(
      habits.map((h) =>
        h.id === habitId
          ? { ...h, completions: { ...h.completions, [today]: (h.completions[today] || 0) + 1 } }
          : h
      )
    );
  };

  const handleToggleDay = (habitId: string, day: string) => {
    persist(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const current = h.completions[day] || 0;
        const newCount = current > 0 ? 0 : 1;
        const completions = { ...h.completions };
        if (newCount === 0) delete completions[day];
        else completions[day] = newCount;
        return { ...h, completions };
      })
    );
  };

  const handleDelete = (habitId: string) => {
    persist(habits.filter((h) => h.id !== habitId));
  };

  const handleEdit = (
    habitId: string,
    updates: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'goalType' | 'goalCount'>>
  ) => {
    persist(habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)));
  };

  return (
    <TooltipProvider>
      <div className="h-full overflow-y-auto bg-background transition-colors">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
          <header className="mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Habits</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {habits.length === 0
                    ? 'Start tracking a new habit'
                    : `Tracking ${habits.length} habit${habits.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* View toggle: Overview / Weekly */}
                <div className="flex items-center rounded-full bg-muted/40 p-[3px] backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode('overview')}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                      viewMode === 'overview'
                        ? 'bg-foreground text-background shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                        : 'text-muted-foreground/60 hover:text-foreground'
                    }`}
                    title="Overview"
                  >
                    <LayoutGrid className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                      viewMode === 'weekly'
                        ? 'bg-foreground text-background shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                        : 'text-muted-foreground/60 hover:text-foreground'
                    }`}
                    title="Weekly"
                  >
                    <CalendarDays className="w-3 h-3" />
                  </button>
                </div>
                {/* Today / Next day toggle - only when in weekly view */}
                {viewMode === 'weekly' && (
                  <div className="flex items-center rounded-full bg-muted/40 p-[3px] backdrop-blur-sm ml-1">
                    <button
                      onClick={() => setWeeklyViewMode('today')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
                        weeklyViewMode === 'today'
                          ? 'bg-foreground text-background shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                          : 'text-muted-foreground/60 hover:text-foreground'
                      }`}
                      title="This week"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setWeeklyViewMode('next')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
                        weeklyViewMode === 'next'
                          ? 'bg-foreground text-background shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                          : 'text-muted-foreground/60 hover:text-foreground'
                      }`}
                      title="Next 7 days"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggleDay={handleToggleDay}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onEdit={handleEdit}
                viewMode={viewMode}
                weeklyViewMode={weeklyViewMode}
              />
            ))}
            <AddHabitDialog onAdd={handleAdd} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
