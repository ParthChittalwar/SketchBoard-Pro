import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";

export function LayersPanel({ wb }: { wb: ReturnType<typeof UseWhiteboard> }) {
  const { state, addLayer, updateLayer, removeLayer, setActiveLayer } = wb;
  return (
    <div className="space-y-2 text-sm">
      <button
        type="button"
        onClick={addLayer}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      >
        <Plus size={13} /> New layer
      </button>
      <ul className="space-y-1">
        {state.layers
          .slice()
          .reverse()
          .map((layer) => {
            const count = state.nodes.filter(
              (n) => (n.layerId ?? "default") === layer.id,
            ).length;
            const active = state.activeLayerId === layer.id;
            return (
              <li
                key={layer.id}
                className={cn(
                  "group flex items-center gap-1 rounded-md border border-transparent px-1.5 py-1 hover:bg-accent",
                  active && "border-border bg-accent",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateLayer(layer.id, { visible: !layer.visible })
                  }
                  className="text-foreground/60 hover:text-foreground"
                  title={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                  className="text-foreground/60 hover:text-foreground"
                  title={layer.locked ? "Unlock layer" : "Lock layer"}
                >
                  {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
                <input
                  className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none focus:ring-1 focus:ring-ring rounded-sm"
                  value={layer.name}
                  onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                  onFocus={() => setActiveLayer(layer.id)}
                />
                <span className="min-w-6 text-right text-[10px] tabular-nums text-muted-foreground">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => removeLayer(layer.id)}
                  disabled={state.layers.length <= 1}
                  className="text-foreground/40 opacity-0 hover:text-destructive group-hover:opacity-100 disabled:hover:text-foreground/40"
                  title="Delete layer"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
