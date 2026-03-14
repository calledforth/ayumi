export const HABIT_ICONS = [
  'Book',
  'Dumbbell',
  'Droplets',
  'Brain',
  'Pencil',
  'Heart',
  'Target',
  'Leaf',
  'Moon',
  'Music',
  'Bike',
  'Apple',
  'Coffee',
  'Sun',
  'Footprints',
  'Timer',
] as const;

export type HabitIconName = (typeof HABIT_ICONS)[number];

export const HABIT_COLORS = [
  { name: 'emerald', bg: '142 55% 36%', light: '142 40% 92%' },
  { name: 'blue', bg: '217 91% 50%', light: '217 80% 92%' },
  { name: 'violet', bg: '263 70% 50%', light: '263 60% 92%' },
  { name: 'rose', bg: '347 77% 50%', light: '347 60% 92%' },
  { name: 'amber', bg: '25 95% 53%', light: '25 80% 92%' },
  { name: 'cyan', bg: '189 94% 43%', light: '189 70% 92%' },
  { name: 'pink', bg: '330 81% 60%', light: '330 60% 92%' },
  { name: 'indigo', bg: '239 84% 67%', light: '239 60% 92%' },
] as const;

export interface Habit {
  id: string;
  name: string;
  icon: HabitIconName;
  color: number;
  goalType: 'daily' | 'weekly';
  goalCount: number;
  completions: Record<string, number>;
  createdAt: string;
}

const STORAGE_KEY = 'habits-tracker-data';

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHabits(habits: Habit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function dateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getLast50Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 49; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(dateStr(d));
  }
  return days;
}

export function getGitHubGridDays(numWeeks = 52): { weeks: string[][]; dayLabels: string[] } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const totalDays = numWeeks * 7 + dayOfWeek + 1;
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    currentWeek.push(dateStr(d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return { weeks, dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
}

export function getStreak(habit: Habit): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateStr(d);
    if ((habit.completions[key] || 0) > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export interface MaxStreakInfo {
  length: number;
  startDate: string;
  endDate: string;
}

export function getMaxStreak(habit: Habit): MaxStreakInfo {
  const sortedDays = Object.keys(habit.completions)
    .filter((d) => habit.completions[d] > 0)
    .sort();

  if (sortedDays.length === 0) return { length: 0, startDate: '', endDate: '' };

  let maxLength = 1;
  let maxStart = sortedDays[0];
  let maxEnd = sortedDays[0];
  let curLength = 1;
  let curStart = sortedDays[0];

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDays[i] + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      curLength++;
    } else {
      if (curLength > maxLength) {
        maxLength = curLength;
        maxStart = curStart;
        maxEnd = sortedDays[i - 1];
      }
      curLength = 1;
      curStart = sortedDays[i];
    }
  }

  if (curLength > maxLength) {
    maxLength = curLength;
    maxStart = curStart;
    maxEnd = sortedDays[sortedDays.length - 1];
  }

  return { length: maxLength, startDate: maxStart, endDate: maxEnd };
}

export function getWeekCompletions(habit: Habit): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  let count = 0;
  for (let i = 0; i <= dayOfWeek; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    count += habit.completions[dateStr(d)] || 0;
  }
  return count;
}

export function createHabit(
  name: string,
  icon: HabitIconName,
  color: number,
  goalType: 'daily' | 'weekly',
  goalCount: number
): Habit {
  return {
    id: crypto.randomUUID(),
    name,
    icon,
    color,
    goalType,
    goalCount,
    completions: {},
    createdAt: todayStr(),
  };
}
