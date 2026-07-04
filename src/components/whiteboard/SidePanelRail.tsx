import { lazy, Suspense, useState } from "react";
import {
  Layers,
  SlidersHorizontal,
  Keyboard,
  X,
  ChevronLeft,
  Sticker,
  LayoutTemplate,
  Settings,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";
import { LayersPanel } from "./panels/LayersPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { ShortcutsPanel } from "./panels/ShortcutsPanel";

const AssetsPanel = lazy(() => import("./panels/AssetsPanel").then((m) => ({ default: m.AssetsPanel })));
const TemplatesPanel = lazy(() => import("./panels/TemplatesPanel").then((m) => ({ default: m.TemplatesPanel })));
const SettingsPanel = lazy(() => import("./panels/SettingsPanel").then((m) => ({ default: m.SettingsPanel })));
const HistoryPanel = lazy(() => import("./panels/HistoryPanel").then((m) => ({ default: m.HistoryPanel })));

type PanelId =
  | "properties"
  | "layers"
  | "assets"
  | "templates"
  | "history"
  | "settings"
  | "shortcuts";

interface Props {
  wb: ReturnType<typeof UseWhiteboard>;
}

const RAIL: { id: PanelId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "properties", label: "Properties", icon: SlidersHorizontal },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "assets", label: "Assets", icon: Sticker },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
];

export function SidePanelRail({ wb }: Props) {
  const [open, setOpen] = useState<PanelId | null>(null);
  return (
    <div className="pointer-events-auto flex items-start gap-2">
      {open && (
        <div
          className="w-72 max-h-[75vh] overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {RAIL.find((r) => r.id === open)?.label}
            </div>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close panel"
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-[calc(75vh-40px)] overflow-y-auto p-3">
            <Suspense fallback={<div className="p-2 text-xs text-muted-foreground">Loading…</div>}>
              {open === "properties" && <PropertiesPanel wb={wb} />}
              {open === "layers" && <LayersPanel wb={wb} />}
              {open === "assets" && <AssetsPanel wb={wb} />}
              {open === "templates" && <TemplatesPanel wb={wb} />}
              {open === "history" && <HistoryPanel wb={wb} />}
              {open === "settings" && <SettingsPanel wb={wb} />}
              {open === "shortcuts" && <ShortcutsPanel />}
            </Suspense>
          </div>
        </div>
      )}
      <div
        className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 backdrop-blur"
        style={{ boxShadow: "var(--shadow-toolbar)" }}
      >
        {RAIL.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setOpen((v) => (v === r.id ? null : r.id))}
            title={r.label}
            aria-label={r.label}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-accent hover:text-foreground",
              open === r.id && "bg-foreground text-background hover:bg-foreground hover:text-background",
            )}
          >
            <r.icon size={17} />
          </button>
        ))}
        {open && (
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-foreground/50 hover:bg-accent hover:text-foreground"
            aria-label="Collapse panel"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
