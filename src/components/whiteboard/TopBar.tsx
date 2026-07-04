import { useRef, useState } from "react";
import {
  Undo2,
  Redo2,
  Trash2,
  Download,
  Sparkles,
  Sun,
  Moon,
  User,
  ChevronDown,
  Menu,
  Grid3x3,
  Image as ImageIcon,
  FileJson,
  Printer,
  Upload,
  Timer,
  Presentation,
  Copy,
  FolderOpen,
  Users,
  MessageSquare,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhiteboardState } from "@/hooks/use-whiteboard";
import { sceneToSVG, drawScene } from "@/lib/whiteboard/render";
import { nodeBounds, type SceneNode } from "@/lib/whiteboard/scene";

interface Props {
  state: WhiteboardState;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onOpenAI: () => void;
  onOpenAuth: () => void;
  onToggleTheme: () => void;
  onCycleGrid: () => void;
  onImportJSON: (data: { nodes: SceneNode[] }) => void;
  onToggleTimer: () => void;
  onTogglePresentation: () => void;
  onOpenBoards: () => void;
  onOpenInvite: () => void;
  onToggleChat: () => void;
  onToggleRuler: () => void;
}

export function TopBar({
  state,
  onUndo,
  onRedo,
  onClear,
  onOpenAI,
  onOpenAuth,
  onToggleTheme,
  onCycleGrid,
  onImportJSON,
  onToggleTimer,
  onTogglePresentation,
  onOpenBoards,
  onOpenInvite,
  onToggleChat,
  onToggleRuler,
}: Props) {
  const [exportOpen, setExportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const exportPNG = () => {
    const { canvas } = renderExportCanvas(state);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "whiteboard.png");
    }, "image/png");
    setExportOpen(false);
  };
  const exportJPG = () => {
    const { canvas } = renderExportCanvas(state, "#ffffff");
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, "whiteboard.jpg");
      },
      "image/jpeg",
      0.92,
    );
    setExportOpen(false);
  };
  const copyImage = async () => {
    const { canvas } = renderExportCanvas(state);
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        // @ts-ignore ClipboardItem may not be typed in some TS libs
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } catch {
        /* clipboard perm denied */
      }
    }, "image/png");
    setExportOpen(false);
  };
  const exportSVG = () => {
    downloadBlob(new Blob([sceneToSVG(state.nodes)], { type: "image/svg+xml" }), "whiteboard.svg");
    setExportOpen(false);
  };
  const exportJSON = () => {
    const json = JSON.stringify({ version: 2, nodes: state.nodes }, null, 2);
    downloadBlob(new Blob([json], { type: "application/json" }), "whiteboard.json");
    setExportOpen(false);
  };
  const printBoard = () => {
    const svg = sceneToSVG(state.nodes);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>Whiteboard</title></head><body style="margin:0">${svg}<script>window.onload=()=>window.print()</script></body></html>`,
    );
    w.document.close();
    setExportOpen(false);
  };
  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data && Array.isArray(data.nodes)) onImportJSON(data);
      } catch {
        /* invalid */
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-card/95 px-2 py-1.5 backdrop-blur"
      style={{ boxShadow: "var(--shadow-toolbar)" }}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold hover:bg-accent"
        >
          <Menu size={16} />
          <span className="hidden sm:inline">WhiteBoard Pro</span>
        </button>
        {menuOpen && (
          <div
            className="absolute left-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
            style={{ boxShadow: "var(--shadow-panel)" }}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <MenuItem
              onClick={() => {
                onOpenBoards();
                setMenuOpen(false);
              }}
              icon={<FolderOpen size={15} />}
              label="Boards…"
            />
            <div className="my-1 border-t border-border" />
            <MenuItem
              onClick={() => {
                onCycleGrid();
                setMenuOpen(false);
              }}
              icon={<Grid3x3 size={15} />}
              label={`Grid: ${state.grid}`}
            />
            <MenuItem
              onClick={() => {
                onToggleTheme();
                setMenuOpen(false);
              }}
              icon={state.theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              label={`Theme: ${state.theme}`}
            />
            <MenuItem
              onClick={() => {
                importInputRef.current?.click();
                setMenuOpen(false);
              }}
              icon={<Upload size={15} />}
              label="Import JSON"
            />
            <div className="my-1 border-t border-border" />
            <MenuItem
              onClick={() => {
                onClear();
                setMenuOpen(false);
              }}
              icon={<Trash2 size={15} />}
              label="Clear board"
              danger
            />
          </div>
        )}
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      <IconBtn label="Undo (⌘Z)" onClick={onUndo}>
        <Undo2 size={16} />
      </IconBtn>
      <IconBtn label="Redo (⌘⇧Z)" onClick={onRedo}>
        <Redo2 size={16} />
      </IconBtn>

      <div className="mx-1 h-6 w-px bg-border" />

      <IconBtn label="Timer" onClick={onToggleTimer}>
        <Timer size={15} />
      </IconBtn>
      <IconBtn label="Ruler / protractor" onClick={onToggleRuler}>
        <Ruler size={15} />
      </IconBtn>
      <IconBtn label="Presentation mode" onClick={onTogglePresentation}>
        <Presentation size={15} />
      </IconBtn>
      <IconBtn label="Chat" onClick={onToggleChat}>
        <MessageSquare size={15} />
      </IconBtn>
      <IconBtn label="Invite collaborators" onClick={onOpenInvite}>
        <Users size={15} />
      </IconBtn>

      <button
        type="button"
        onClick={onOpenAI}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent"
      >
        <Sparkles size={15} />
        <span className="hidden md:inline">AI</span>
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setExportOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent"
        >
          <Download size={15} />
          <span className="hidden md:inline">Export</span>
          <ChevronDown size={13} className="opacity-60" />
        </button>
        {exportOpen && (
          <div
            className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
            style={{ boxShadow: "var(--shadow-panel)" }}
            onMouseLeave={() => setExportOpen(false)}
          >
            <MenuItem onClick={exportPNG} icon={<ImageIcon size={15} />} label="PNG image" />
            <MenuItem onClick={exportJPG} icon={<ImageIcon size={15} />} label="JPG image" />
            <MenuItem onClick={exportSVG} icon={<ImageIcon size={15} />} label="SVG vector" />
            <MenuItem onClick={exportJSON} icon={<FileJson size={15} />} label="JSON scene" />
            <MenuItem onClick={copyImage} icon={<Copy size={15} />} label="Copy as image" />
            <MenuItem onClick={printBoard} icon={<Printer size={15} />} label="Print / PDF" />
          </div>
        )}
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      <button
        type="button"
        onClick={onOpenAuth}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium",
          "bg-foreground text-background hover:opacity-90",
        )}
      >
        <User size={14} />
        <span>Sign in</span>
      </button>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

function MenuItem({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
        danger && "text-destructive hover:bg-destructive/10",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function renderExportCanvas(state: WhiteboardState, forceBg?: string) {
  if (!state.nodes.length) return { canvas: null, w: 0, h: 0 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of state.nodes) {
    const b = nodeBounds(n);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }
  const pad = 32;
  const w = Math.ceil(maxX - minX + pad * 2);
  const h = Math.ceil(maxY - minY + pad * 2);
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle =
    forceBg ??
    (state.theme === "dark" ? "#1a1a1f" : state.theme === "chalk" ? "#2b4a35" : "#ffffff");
  ctx.fillRect(0, 0, w, h);
  drawScene(ctx, state.nodes, { x: -minX + pad, y: -minY + pad, zoom: 1 }, { width: w, height: h });
  return { canvas, w, h };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
