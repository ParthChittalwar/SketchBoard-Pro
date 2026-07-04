import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Camera } from "@/lib/whiteboard/scene";

export function ZoomControls({
  camera,
  onChange,
  onReset,
}: {
  camera: Camera;
  onChange: (updater: (c: Camera) => Camera) => void;
  onReset: () => void;
}) {
  const pct = Math.round(camera.zoom * 100);
  return (
    <div
      className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border bg-card/95 px-1 py-1 text-sm backdrop-blur"
      style={{ boxShadow: "var(--shadow-toolbar)" }}
    >
      <button
        type="button"
        onClick={() => onChange((c) => ({ ...c, zoom: Math.max(0.1, c.zoom / 1.2) }))}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent"
        aria-label="Zoom out"
      >
        <ZoomOut size={14} />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="min-w-[3.5rem] rounded-full px-2 py-0.5 text-xs font-medium tabular-nums hover:bg-accent"
        title="Reset view"
      >
        {pct}%
      </button>
      <button
        type="button"
        onClick={() => onChange((c) => ({ ...c, zoom: Math.min(6, c.zoom * 1.2) }))}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent"
        aria-label="Zoom in"
      >
        <ZoomIn size={14} />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent"
        aria-label="Fit"
        title="Reset view"
      >
        <Maximize2 size={13} />
      </button>
    </div>
  );
}
