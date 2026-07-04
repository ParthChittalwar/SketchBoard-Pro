import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  FlipHorizontal,
  FlipVertical,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  Lock,
  CopyPlus,
  Trash2,
} from "lucide-react";
import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";

export function PropertiesPanel({ wb }: { wb: ReturnType<typeof UseWhiteboard> }) {
  const { state, align, distribute, arrange, flip, toggleLock, duplicate, deleteSelection } = wb;
  const count = state.selection.size;
  return (
    <div className="space-y-4 text-sm">
      <div className="text-xs text-muted-foreground">
        {count === 0 ? "No selection" : count === 1 ? "1 object selected" : `${count} objects selected`}
      </div>

      <Section title="Align">
        <div className="grid grid-cols-6 gap-1">
          <IconBtn label="Left" onClick={() => align("left")}><AlignLeft size={14} /></IconBtn>
          <IconBtn label="Center X" onClick={() => align("center-x")}><AlignCenter size={14} /></IconBtn>
          <IconBtn label="Right" onClick={() => align("right")}><AlignRight size={14} /></IconBtn>
          <IconBtn label="Top" onClick={() => align("top")}><AlignStartVertical size={14} /></IconBtn>
          <IconBtn label="Center Y" onClick={() => align("center-y")}><AlignCenterVertical size={14} /></IconBtn>
          <IconBtn label="Bottom" onClick={() => align("bottom")}><AlignEndVertical size={14} /></IconBtn>
        </div>
      </Section>

      <Section title="Distribute">
        <div className="grid grid-cols-2 gap-1">
          <IconBtn label="Distribute horizontally" onClick={() => distribute("x")}>
            <AlignHorizontalDistributeCenter size={14} />
          </IconBtn>
          <IconBtn label="Distribute vertically" onClick={() => distribute("y")}>
            <AlignVerticalDistributeCenter size={14} />
          </IconBtn>
        </div>
      </Section>

      <Section title="Arrange">
        <div className="grid grid-cols-4 gap-1">
          <IconBtn label="Bring forward" onClick={() => arrange("forward")}><ChevronUp size={14} /></IconBtn>
          <IconBtn label="To front" onClick={() => arrange("front")}><ArrowUpToLine size={14} /></IconBtn>
          <IconBtn label="Send backward" onClick={() => arrange("backward")}><ChevronDown size={14} /></IconBtn>
          <IconBtn label="To back" onClick={() => arrange("back")}><ArrowDownToLine size={14} /></IconBtn>
        </div>
      </Section>

      <Section title="Transform">
        <div className="grid grid-cols-4 gap-1">
          <IconBtn label="Flip H" onClick={() => flip("h")}><FlipHorizontal size={14} /></IconBtn>
          <IconBtn label="Flip V" onClick={() => flip("v")}><FlipVertical size={14} /></IconBtn>
          <IconBtn label="Lock" onClick={toggleLock}><Lock size={14} /></IconBtn>
          <IconBtn label="Duplicate" onClick={duplicate}><CopyPlus size={14} /></IconBtn>
        </div>
      </Section>

      <button
        type="button"
        onClick={deleteSelection}
        disabled={!count}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 size={13} /> Delete selection
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 items-center justify-center rounded-md border border-border text-foreground/70 hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}
