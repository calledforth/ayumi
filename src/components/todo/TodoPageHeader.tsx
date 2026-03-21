import { Plus } from 'lucide-react';
import { format, getDate } from 'date-fns';

function ordinalSuffix(day: number) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export interface TodoPageHeaderProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
}

/**
 * Preserved design: date title (e.g. "Wednesday 18 March") + add task / create section input.
 * Can be reused in other layouts if needed.
 */
export function TodoPageHeader({
  value,
  onChange,
  onAdd,
  onKeyDown,
  placeholder,
}: TodoPageHeaderProps) {
  const today = new Date();
  const dayName = format(today, 'EEEE');
  const dayNum = getDate(today);
  const monthName = format(today, 'MMMM');

  return (
    <div className="shrink-0 flex flex-col items-center pt-8 pb-5 px-8">
      <h1 className="text-[2.75rem] font-bold tracking-tight leading-none select-none">
        <span className="text-(--note-text)">
          {dayName} {dayNum}
          {ordinalSuffix(dayNum)},
        </span>{' '}
        <span className="text-(--note-text-muted)">{monthName}</span>
      </h1>

      <div className="mt-4 w-full max-w-lg relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-(--workspace-card) rounded-xl px-5 py-3 text-sm shadow-sm outline-none border-none text-(--note-text) placeholder:text-(--note-text-muted)/60"
        />
        <button
          onClick={onAdd}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-(--note-text-muted) hover:text-(--note-text) transition-colors rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
