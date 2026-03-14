import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { HABIT_ICONS, HABIT_COLORS } from '@/lib/habits';
import type { HabitIconName } from '@/lib/habits';
import { HabitIcon } from './HabitIcon';

interface AddHabitDialogProps {
  onAdd: (
    name: string,
    icon: HabitIconName,
    color: number,
    goalType: 'daily' | 'weekly',
    goalCount: number
  ) => void;
}

export function AddHabitDialog({ onAdd }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<HabitIconName>('Target');
  const [colorIdx, setColorIdx] = useState(0);
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>('daily');
  const [goalCount, setGoalCount] = useState(1);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), icon, colorIdx, goalType, goalCount);
    setName('');
    setIcon('Target');
    setColorIdx(0);
    setGoalType('daily');
    setGoalCount(1);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="border border-dashed border-border rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors w-full">
          <Plus className="w-4 h-4" />
          New habit
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">New habit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {HABIT_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                    icon === ic ? 'bg-accent ring-1 ring-foreground/20' : 'hover:bg-accent'
                  }`}
                >
                  <HabitIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {HABIT_COLORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setColorIdx(i)}
                  className="relative w-7 h-7 rounded-full transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(${c.bg})`,
                    boxShadow:
                      colorIdx === i
                        ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(${c.bg})`
                        : 'none',
                    transform: colorIdx === i ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {colorIdx === i && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 30 minutes"
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1.5 block">Frequency</label>
              <div className="flex rounded-md border border-input overflow-hidden">
                <button
                  onClick={() => setGoalType('daily')}
                  className={`flex-1 text-xs py-1.5 transition-colors ${
                    goalType === 'daily' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setGoalType('weekly')}
                  className={`flex-1 text-xs py-1.5 transition-colors ${
                    goalType === 'weekly' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className="w-20">
              <label className="text-xs text-muted-foreground mb-1.5 block">Goal</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={goalCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v >= 1 && v <= 20) setGoalCount(v);
                  else if (e.target.value === '') setGoalCount(1);
                }}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full h-9 text-sm" disabled={!name.trim()}>
            Add habit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
