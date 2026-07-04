import { Undo2, Redo2, Trash2 } from "lucide-react";
import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";

export function HistoryPanel({ wb }: { wb: ReturnType<typeof UseWhiteboard> }) {
  const total = wb.state.nodes.length;
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-border p-3">
        <div className="text-xs text-muted-foreground">Objects on board</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{total}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={wb.undo}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Undo2 size={13} /> Undo
        </button>
        <button
          type="button"
          onClick={wb.redo}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Redo2 size={13} /> Redo
        </button>
      </div>
      <button
        type="button"
        onClick={wb.clear}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
      >
        <Trash2 size={13} /> Clear board
      </button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Up to 120 recent steps are retained. Undo/redo also respond to ⌘Z / ⌘⇧Z.
      </p>
    </div>
  );
}
