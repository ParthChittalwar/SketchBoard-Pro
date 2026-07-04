import { useEffect, useState } from "react";
import { FolderOpen, Plus, Trash2, Star, StarOff, Copy, X } from "lucide-react";
import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";
import { deleteBoard, getBoard, listBoards, saveBoard, type BoardMeta } from "@/lib/whiteboard/boards";
import { uid } from "@/lib/whiteboard/scene";

interface Props {
  open: boolean;
  onClose: () => void;
  wb: ReturnType<typeof UseWhiteboard>;
}

export function BoardsDialog({ open, onClose, wb }: Props) {
  const [boards, setBoards] = useState<BoardMeta[]>([]);
  const [current, setCurrent] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("wbpro:currentBoard") : null,
  );

  const refresh = () => listBoards().then(setBoards);
  useEffect(() => {
    if (open) refresh();
  }, [open]);

  if (!open) return null;

  const saveCurrent = async (name?: string) => {
    const id = current ?? uid();
    const rec = {
      id,
      name: name ?? boards.find((b) => b.id === id)?.name ?? `Untitled board`,
      updatedAt: Date.now(),
      nodes: wb.state.nodes,
    };
    await saveBoard(rec);
    localStorage.setItem("wbpro:currentBoard", id);
    setCurrent(id);
    refresh();
  };

  const openBoard = async (id: string) => {
    const rec = await getBoard(id);
    if (!rec) return;
    wb.importJSON({ nodes: rec.nodes });
    localStorage.setItem("wbpro:currentBoard", id);
    setCurrent(id);
    onClose();
  };

  const newBoard = () => {
    wb.importJSON({ nodes: [] });
    localStorage.removeItem("wbpro:currentBoard");
    setCurrent(null);
    onClose();
  };

  const rename = async (b: BoardMeta) => {
    const name = prompt("Board name", b.name);
    if (!name) return;
    const rec = await getBoard(b.id);
    if (!rec) return;
    await saveBoard({ ...rec, name, updatedAt: Date.now() });
    refresh();
  };

  const duplicate = async (b: BoardMeta) => {
    const rec = await getBoard(b.id);
    if (!rec) return;
    await saveBoard({ ...rec, id: uid(), name: `${rec.name} copy`, updatedAt: Date.now() });
    refresh();
  };

  const toggleFav = async (b: BoardMeta) => {
    const rec = await getBoard(b.id);
    if (!rec) return;
    await saveBoard({ ...rec, favorite: !rec.favorite });
    refresh();
  };

  const remove = async (b: BoardMeta) => {
    if (!confirm(`Delete "${b.name}"?`)) return;
    await deleteBoard(b.id);
    if (current === b.id) {
      localStorage.removeItem("wbpro:currentBoard");
      setCurrent(null);
    }
    refresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
        style={{ boxShadow: "var(--shadow-panel)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FolderOpen size={16} /> Your boards
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={newBoard}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Plus size={13} /> New
          </button>
          <button
            type="button"
            onClick={() => {
              const name = prompt("Board name", "Untitled board");
              if (name !== null) saveCurrent(name);
            }}
            className="flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            Save current
          </button>
          <div className="ml-auto text-xs text-muted-foreground">
            {boards.length} board{boards.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {boards.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No boards saved yet. Click "Save current" to store this board.
            </div>
          )}
          <ul className="divide-y divide-border">
            {boards
              .slice()
              .sort((a, b) => Number(b.favorite ?? 0) - Number(a.favorite ?? 0) || b.updatedAt - a.updatedAt)
              .map((b) => (
                <li key={b.id} className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
                  <button
                    onClick={() => toggleFav(b)}
                    className="text-muted-foreground hover:text-foreground"
                    title={b.favorite ? "Unfavorite" : "Favorite"}
                  >
                    {b.favorite ? <Star size={14} className="fill-yellow-400 text-yellow-500" /> : <StarOff size={14} />}
                  </button>
                  <button
                    onClick={() => openBoard(b.id)}
                    className="flex-1 text-left"
                    onDoubleClick={() => rename(b)}
                  >
                    <div className="text-sm font-medium">
                      {b.name}
                      {current === b.id && (
                        <span className="ml-2 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          current
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Updated {new Date(b.updatedAt).toLocaleString()}
                    </div>
                  </button>
                  <button
                    onClick={() => duplicate(b)}
                    className="opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => remove(b)}
                    className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
