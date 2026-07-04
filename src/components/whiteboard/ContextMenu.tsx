import { useEffect, useRef } from "react";
import {
  Copy,
  Scissors,
  Clipboard,
  CopyPlus,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContextMenuState {
  x: number;
  y: number;
  hasSelection: boolean;
}

interface Actions {
  copy: () => void;
  cut: () => void;
  paste: () => void;
  duplicate: () => void;
  deleteSelection: () => void;
  bringForward: () => void;
  bringToFront: () => void;
  sendBackward: () => void;
  sendToBack: () => void;
  toggleLock: () => void;
}

export function ContextMenu({
  state,
  hasSelection,
  onClose,
  actions,
}: {
  state: ContextMenuState;
  hasSelection: boolean;
  onClose: () => void;
  actions: Actions;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const items: (
    | { kind: "item"; label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; hint?: string }
    | { kind: "sep" }
  )[] = [
    { kind: "item", label: "Copy", icon: <Copy size={14} />, onClick: run(actions.copy), disabled: !hasSelection, hint: "⌘C" },
    { kind: "item", label: "Cut", icon: <Scissors size={14} />, onClick: run(actions.cut), disabled: !hasSelection, hint: "⌘X" },
    { kind: "item", label: "Paste", icon: <Clipboard size={14} />, onClick: run(actions.paste), hint: "⌘V" },
    { kind: "item", label: "Duplicate", icon: <CopyPlus size={14} />, onClick: run(actions.duplicate), disabled: !hasSelection, hint: "⌘D" },
    { kind: "sep" },
    { kind: "item", label: "Bring forward", icon: <ChevronUp size={14} />, onClick: run(actions.bringForward), disabled: !hasSelection, hint: "⌘]" },
    { kind: "item", label: "Bring to front", icon: <ArrowUpToLine size={14} />, onClick: run(actions.bringToFront), disabled: !hasSelection, hint: "⌘⇧]" },
    { kind: "item", label: "Send backward", icon: <ChevronDown size={14} />, onClick: run(actions.sendBackward), disabled: !hasSelection, hint: "⌘[" },
    { kind: "item", label: "Send to back", icon: <ArrowDownToLine size={14} />, onClick: run(actions.sendToBack), disabled: !hasSelection, hint: "⌘⇧[" },
    { kind: "sep" },
    { kind: "item", label: "Lock / Unlock", icon: <Lock size={14} />, onClick: run(actions.toggleLock), disabled: !hasSelection, hint: "⌘L" },
    { kind: "item", label: "Delete", icon: <Trash2 size={14} />, onClick: run(actions.deleteSelection), disabled: !hasSelection, hint: "⌫" },
  ];

  function run(fn: () => void) {
    return () => {
      fn();
      onClose();
    };
  }

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(state.x, window.innerWidth - 240),
    top: Math.min(state.y, window.innerHeight - 380),
    zIndex: 60,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground"
    >
      {items.map((it, i) =>
        it.kind === "sep" ? (
          <div key={i} className="my-1 h-px bg-border" />
        ) : (
          <button
            key={i}
            type="button"
            disabled={it.disabled}
            onClick={it.onClick}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/85 hover:bg-accent hover:text-foreground",
              it.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-foreground/85",
            )}
          >
            <span className="opacity-80">{it.icon}</span>
            <span className="flex-1 text-left">{it.label}</span>
            {it.hint && (
              <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                {it.hint}
              </kbd>
            )}
          </button>
        ),
      )}
    </div>
  );
}
