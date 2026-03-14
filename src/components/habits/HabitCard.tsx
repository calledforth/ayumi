import { useState } from 'react';
import {
  Habit,
  HABIT_COLORS,
  HABIT_ICONS,
  todayStr,
  getStreak,
  getWeekCompletions,
  getMaxStreak,
} from '@/lib/habits';
import type { HabitIconName } from '@/lib/habits';
import { HeatmapGrid } from './HeatmapGrid';
import { WeeklyView } from './WeeklyView';
import { HabitIcon } from './HabitIcon';
import { Check, Trash2, Flame, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { WeeklyViewMode } from './WeeklyView';

interface HabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, day: string) => void;
  onComplete: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  onEdit: (
    habitId: string,
    updates: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'goalType' | 'goalCount'>>
  ) => void;
  viewMode: 'overview' | 'weekly';
  weeklyViewMode?: WeeklyViewMode;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HabitCard({
  habit,
  onToggleDay,
  onComplete,
  onDelete,
  onEdit,
  viewMode,
  weeklyViewMode = 'today',
}: HabitCardProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editIcon, setEditIcon] = useState(habit.icon);
  const [editColor, setEditColor] = useState(habit.color);
  const [editGoalType, setEditGoalType] = useState(habit.goalType);
  const [editGoalCount, setEditGoalCount] = useState(habit.goalCount);

  const today = todayStr();
  const todayCount = habit.completions[today] || 0;
  const isDoneToday = todayCount >= habit.goalCount;
  const streak = getStreak(habit);
  const maxStreak = getMaxStreak(habit);
  const weekCount = getWeekCompletions(habit);
  const color = HABIT_COLORS[habit.color] ?? HABIT_COLORS[0];

  const goalLabel =
    habit.goalType === 'daily'
      ? `${todayCount}/${habit.goalCount} today`
      : `${weekCount}/${habit.goalCount} this week`;

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onEdit(habit.id, {
        name: editName.trim(),
        icon: editIcon,
        color: editColor,
        goalType: editGoalType,
        goalCount: editGoalCount,
      });
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(habit.name);
    setEditIcon(habit.icon);
    setEditColor(habit.color);
    setEditGoalType(habit.goalType);
    setEditGoalCount(habit.goalCount);
    setEditing(false);
  };

  const editColor_ = HABIT_COLORS[editColor] ?? HABIT_COLORS[0];

  return (
    <div className="relative border border-border rounded-lg px-3 py-2 transition-colors group">
      {/* Border-positioned controls */}
      <div className="absolute -top-2.5 right-2 flex items-center gap-1.5 z-10">
        {streak > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-background border border-border text-muted-foreground cursor-default">
                <Flame className="w-3.5 h-3.5 text-streak" />
                {streak}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Current streak: {streak} day{streak !== 1 ? 's' : ''}
            </TooltipContent>
          </Tooltip>
        )}
        {maxStreak.length > 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-background border border-border text-muted-foreground cursor-default">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {maxStreak.length}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="font-semibold">Best streak: {maxStreak.length} days</div>
              <div className="text-muted-foreground">
                {formatDateShort(maxStreak.startDate)} – {formatDateShort(maxStreak.endDate)}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        <button
          onClick={() => onComplete(habit.id)}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all border"
          style={{
            backgroundColor: isDoneToday ? `hsl(${color.bg})` : 'hsl(var(--background))',
            color: isDoneToday ? 'white' : `hsl(${color.bg})`,
            borderColor: isDoneToday ? `hsl(${color.bg})` : 'hsl(var(--border))',
          }}
          title="Mark complete"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete habit"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">Delete &quot;{habit.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will permanently remove this habit and all its tracking data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(habit.id)}
                className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Header - always visible */}
      <button
        onClick={() => setEditing(!editing)}
        className="flex items-center gap-2 hover:opacity-70 transition-opacity mb-0.5"
      >
        <HabitIcon
          name={editing ? editIcon : habit.icon}
          className="w-4 h-4 shrink-0"
          style={{ color: `hsl(${(editing ? editColor_ : color).bg})` }}
        />
        <h3 className="text-xs font-medium leading-tight">{editing ? editName : habit.name}</h3>
        <span className="text-[10px] text-muted-foreground">·</span>
        <p className="text-[10px] text-muted-foreground">{goalLabel}</p>
      </button>

      {/* Heatmap/Weekly - always visible */}
      {viewMode === 'overview' ? (
        <HeatmapGrid
          completions={habit.completions}
          goalCount={habit.goalType === 'daily' ? habit.goalCount : Math.ceil(habit.goalCount / 7)}
          color={editing ? editColor_ : color}
          onToggleDay={(day) => onToggleDay(habit.id, day)}
        />
      ) : (
        <WeeklyView
          habit={habit}
          color={editing ? editColor_ : color}
          onToggleDay={(day) => onToggleDay(habit.id, day)}
          mode={weeklyViewMode}
        />
      )}

      {/* Edit panel - shown below the heatmap */}
      {editing && (
        <div className="space-y-3 mt-3 pt-3 border-t border-border">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
            <div className="flex gap-1 flex-wrap">
              {HABIT_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setEditIcon(ic)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    editIcon === ic ? 'bg-accent ring-1 ring-foreground/20' : 'hover:bg-accent'
                  }`}
                >
                  <HabitIcon name={ic} className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Color</label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setEditColor(i)}
                  className="relative w-6 h-6 rounded-full transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(${c.bg})`,
                    boxShadow:
                      editColor === i
                        ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(${c.bg})`
                        : 'none',
                    transform: editColor === i ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {editColor === i && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
              <div className="flex rounded-md border border-input overflow-hidden">
                <button
                  onClick={() => setEditGoalType('daily')}
                  className={`flex-1 text-xs py-1.5 transition-colors ${
                    editGoalType === 'daily' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setEditGoalType('weekly')}
                  className={`flex-1 text-xs py-1.5 transition-colors ${
                    editGoalType === 'weekly' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className="w-20">
              <label className="text-xs text-muted-foreground mb-1 block">Goal</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editGoalCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v >= 1 && v <= 20) setEditGoalCount(v);
                  else if (e.target.value === '') setEditGoalCount(1);
                }}
                className="h-7 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-xs px-3 py-1 rounded-md hover:bg-accent transition-colors text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
