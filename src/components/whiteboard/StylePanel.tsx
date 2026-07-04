import { cn } from "@/lib/utils";
import type { DashStyle } from "@/lib/whiteboard/scene";

const SWATCHES = [
  "#111111",
  "#4B5563",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#FFFFFF",
];

const SIZES = [1, 2, 3, 5, 8, 14];

const DASH_STYLES: { id: DashStyle; label: string; pattern: string }[] = [
  { id: "solid", label: "Solid", pattern: "──" },
  { id: "dashed", label: "Dashed", pattern: "╌╌" },
  { id: "dotted", label: "Dotted", pattern: "···" },
];

export function StylePanel({
  color,
  size,
  fill,
  opacity,
  dash,
  onColor,
  onSize,
  onFill,
  onOpacity,
  onDash,
}: {
  color: string;
  size: number;
  fill: string | null;
  opacity: number;
  dash: DashStyle;
  onColor: (c: string) => void;
  onSize: (s: number) => void;
  onFill: (f: string | null) => void;
  onOpacity: (o: number) => void;
  onDash: (d: DashStyle) => void;
}) {
  return (
    <div
      className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/95 px-3 py-2 backdrop-blur"
      style={{ boxShadow: "var(--shadow-toolbar)" }}
    >
      <div className="flex items-center gap-1">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => onColor(c)}
            className={cn(
              "h-5 w-5 rounded-full border border-black/10 transition-transform",
              color === c && "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110",
            )}
            style={{ background: c }}
          />
        ))}
        <label className="ml-1 h-5 w-5 cursor-pointer overflow-hidden rounded-full border border-border">
          <input
            type="color"
            value={color}
            onChange={(e) => onColor(e.target.value)}
            className="h-8 w-8 -translate-x-1 -translate-y-1 cursor-pointer border-0 p-0"
            aria-label="Custom color"
          />
        </label>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSize(s)}
            aria-label={`Size ${s}`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent",
              size === s && "bg-foreground/10",
            )}
          >
            <span
              className="rounded-full bg-foreground"
              style={{ width: Math.min(18, s * 2), height: Math.min(18, s * 2) }}
            />
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Dash style */}
      <div className="flex items-center gap-0.5">
        {DASH_STYLES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onDash(d.id)}
            title={d.label}
            className={cn(
              "flex h-7 w-8 items-center justify-center rounded-md text-xs font-medium tracking-tight text-foreground/70 hover:bg-accent hover:text-foreground",
              dash === d.id && "bg-foreground/10 text-foreground",
            )}
          >
            {d.pattern}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Opacity slider */}
      <label
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
        title="Opacity"
      >
        <span>{Math.round(opacity * 100)}%</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => onOpacity(parseFloat(e.target.value))}
          className="wb-range h-1 w-24 cursor-pointer accent-foreground"
          aria-label="Opacity"
        />
      </label>

      <div className="h-6 w-px bg-border" />

      <button
        type="button"
        onClick={() => onFill(fill ? null : color)}
        className={cn(
          "rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-accent",
          fill ? "bg-foreground text-background hover:bg-foreground" : "text-muted-foreground",
        )}
        title="Toggle shape fill"
      >
        Fill
      </button>
    </div>
  );
}
