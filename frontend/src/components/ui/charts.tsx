import * as React from 'react';
import { cn } from '../../lib/utils';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export function InteractiveBarChart({
  data,
  height = 180,
  className
}: {
  data: DataPoint[];
  height?: number;
  className?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 10);

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <div className="flex items-end justify-between gap-2 pt-4 px-2" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const heightPct = (item.value / maxValue) * 100;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              <div
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded bg-popover text-popover-foreground border border-border shadow-sm mb-1 transition-opacity duration-150',
                  isHovered ? 'opacity-100' : 'opacity-0'
                )}
              >
                {item.value}
              </div>

              {/* Bar */}
              <div
                className={cn(
                  'w-full max-w-[28px] rounded-t-md transition-all duration-200',
                  isHovered
                    ? 'bg-primary shadow-md shadow-primary/30'
                    : 'bg-primary/70 hover:bg-primary/90'
                )}
                style={{ height: `${Math.max(heightPct, 6)}%` }}
              />

              <span className="text-[10px] font-medium text-muted-foreground mt-2 truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InteractiveLineChart({
  data,
  height = 160,
  className
}: {
  data: { label: string; value: number }[];
  height?: number;
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const width = 500;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.value / maxValue) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="hsl(var(--border))" strokeDasharray="3 3" />

        {/* Gradient fill under curve */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Smooth line */}
        <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />

        {/* Points & Interactive circles */}
        {points.map((p, idx) => (
          <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === idx ? 5 : 3.5}
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="transition-all"
            />
          </g>
        ))}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 px-2 py-1 rounded bg-popover text-popover-foreground border border-border shadow-lg text-[11px] font-mono pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100 - 10}%`
          }}
        >
          {points[hoveredIndex].label}: <span className="font-bold text-primary">{points[hoveredIndex].value}</span>
        </div>
      )}
    </div>
  );
}
