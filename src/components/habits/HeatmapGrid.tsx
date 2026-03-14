import { useState, useRef, useEffect } from 'react';
import { getGitHubGridDays, todayStr } from '@/lib/habits';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeatmapGridProps {
  completions: Record<string, number>;
  goalCount: number;
  color: { bg: string };
  onToggleDay: (day: string) => void;
}

function getHeatLevel(count: number, goal: number): number {
  if (count === 0) return 0;
  const ratio = count / goal;
  if (ratio < 0.5) return 1;
  if (ratio < 1) return 2;
  if (ratio === 1) return 3;
  return 4;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function HeatmapGrid({ completions, goalCount, color, onToggleDay }: HeatmapGridProps) {
  const isMobile = useIsMobile();
  const numWeeks = isMobile ? 18 : 52;
  const { weeks } = getGitHubGridDays(numWeeks);
  const today = todayStr();
  const [tooltip, setTooltip] = useState<{ day: string; count: number; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [numWeeks]);

  const svgWidth = weeks.length * 3 + 2;
  const svgHeight = 7 * 3 + 2;

  return (
    <div className="relative w-full overflow-x-auto scrollbar-hide" ref={scrollRef}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="block w-full h-auto"
        preserveAspectRatio="none"
      >
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const count = completions[day] || 0;
            const level = getHeatLevel(count, goalCount);
            const isToday = day === today;
            const opacity = level === 0 ? 0 : 0.25 + level * 0.2;
            const x = wi * 3;
            const y = di * 3;

            return (
              <rect
                key={day}
                x={x}
                y={y}
                width={2.5}
                height={2.5}
                rx={0.5}
                fill={level === 0 ? 'hsl(var(--heat-0))' : `hsl(${color.bg} / ${opacity})`}
                stroke={isToday ? 'hsl(var(--foreground) / 0.3)' : 'none'}
                strokeWidth={isToday ? 0.3 : 0}
                className="cursor-pointer"
                onClick={() => onToggleDay(day)}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  setTooltip({ day, count, x: rect.left + rect.width / 2, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })
        )}
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-md text-xs font-medium shadow-lg pointer-events-none border border-border bg-popover text-popover-foreground"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <span className="font-semibold">
            {tooltip.count} completion{tooltip.count !== 1 ? 's' : ''}
          </span>
          <span className="text-muted-foreground ml-1.5">{formatDate(tooltip.day)}</span>
        </div>
      )}
    </div>
  );
}
