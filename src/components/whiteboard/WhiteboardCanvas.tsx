import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Camera, SceneNode, Point, ToolId, StrokeTool } from "@/lib/whiteboard/scene";
import { hitTest, nodeInRect, translateNode, uid } from "@/lib/whiteboard/scene";
import { drawScene } from "@/lib/whiteboard/render";
import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";
import { ContextMenu, type ContextMenuState } from "./ContextMenu";
import { LaserOverlay } from "./LaserOverlay";
import { SpotlightOverlay } from "./SpotlightOverlay";

type WB = ReturnType<typeof UseWhiteboard>;

interface Props {
  wb: WB;
}

const STROKE_TOOLS = new Set<ToolId>([
  "pen",
  "smoothPen",
  "pencil",
  "marker",
  "brush",
  "highlighter",
  "chalk",
  "calligraphy",
  "fountain",
]);

const ERASER_TOOLS = new Set<ToolId>(["eraser", "strokeEraser", "objectEraser"]);

/** The interactive whiteboard canvas. */
export function WhiteboardCanvas({ wb }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [editingText, setEditingText] = useState<{
    id: string;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [laserPoints, setLaserPoints] = useState<{ x: number; y: number; t: number }[]>([]);
  const [spotlight, setSpotlight] = useState<{ x: number; y: number } | null>(null);

  const {
    state,
    setCamera,
    setSelection,
    commit,
    setNodesLive,
    deleteSelection,
    undo,
    redo,
    copy,
    cut,
    paste,
    duplicate,
    arrange,
    toggleLock,
  } = wb;

  const interactionRef = useRef<{
    kind: "none" | "draw" | "shape" | "pan" | "select" | "move" | "marquee";
    startWorld?: Point;
    startClient?: { x: number; y: number };
    startCamera?: Camera;
    activeNode?: SceneNode;
    moveOffset?: Map<string, { dx: number; dy: number }>;
    baseNodes?: SceneNode[];
  }>({ kind: "none" });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const forceRedraw = useCallback(() => {
    setSize((s) => ({ ...s }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const visibleLayerIds = new Set(state.layers.filter((l) => l.visible).map((l) => l.id));
    const visibleNodes = state.nodes.filter(
      (n) => !n.layerId || visibleLayerIds.has(n.layerId),
    );
    drawScene(ctx, visibleNodes, state.camera, {
      width: size.w,
      height: size.h,
      selectionIds: state.selection,
      onImageLoad: forceRedraw,
    });

    // Marquee overlay
    if (marquee) {
      ctx.save();
      ctx.strokeStyle = "oklch(0.58 0.16 252)";
      ctx.fillStyle = "oklch(0.58 0.16 252 / 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.restore();
    }
  }, [state.nodes, state.camera, state.selection, state.layers, size, marquee, forceRedraw]);

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (clientX - rect.left - state.camera.x) / state.camera.zoom;
      const y = (clientY - rect.top - state.camera.y) / state.camera.zoom;
      return { x, y };
    },
    [state.camera],
  );

  // Keyboard shortcuts (extended)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key === "Z"))) {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copy();
        return;
      }
      if (meta && e.key.toLowerCase() === "x") {
        e.preventDefault();
        cut();
        return;
      }
      if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        paste();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
        return;
      }
      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelection(new Set(state.nodes.map((n) => n.id)));
        return;
      }
      if (meta && e.key === "]") {
        e.preventDefault();
        e.shiftKey ? arrange("front") : arrange("forward");
        return;
      }
      if (meta && e.key === "[") {
        e.preventDefault();
        e.shiftKey ? arrange("back") : arrange("backward");
        return;
      }
      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLock();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selection.size) {
          e.preventDefault();
          deleteSelection();
        }
        return;
      }
      if (e.key === "Escape") {
        setSelection(new Set());
        setCtxMenu(null);
        wb.setPresentation(false);
        wb.setScreenOverlay("none");
        return;
      }
      if (e.key === " " && !meta) {
        // Momentary pan
        e.preventDefault();
        wb.setTool("hand");
        return;
      }

      const shortcuts: Record<string, () => void> = {
        v: () => wb.setTool("select"),
        m: () => wb.setTool("marquee"),
        h: () => wb.setTool("hand"),
        p: () => wb.setTool("pen"),
        b: () => wb.setTool("marker"),
        i: () => wb.setTool("highlighter"),
        e: () => wb.setTool("eraser"),
        r: () => wb.setTool("rect"),
        o: () => wb.setTool("ellipse"),
        l: () => wb.setTool("line"),
        a: () => wb.setTool("arrow"),
        t: () => wb.setTool("text"),
        n: () => wb.setTool("sticky"),
        f: () => wb.setTool("frame"),
      };
      if (!meta && shortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        shortcuts[e.key.toLowerCase()]();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    undo,
    redo,
    copy,
    cut,
    paste,
    duplicate,
    deleteSelection,
    arrange,
    toggleLock,
    setSelection,
    state.selection,
    state.nodes,
    wb,
  ]);

  // Non-passive wheel: zoom / pan
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.0015);
        setCamera((c) => zoomAt(c, factor, e.clientX, e.clientY, el));
      } else {
        setCamera((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setCamera]);

  // Paste images from clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith("image/")) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            insertImageFromFile(file);
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodes, state.camera]);

  const insertImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const cx = size.w / 2;
        const cy = size.h / 2;
        const rect = canvasRef.current!.getBoundingClientRect();
        const world = {
          x: (cx - state.camera.x) / state.camera.zoom,
          y: (cy - state.camera.y) / state.camera.zoom,
        };
        void rect;
        const maxSide = 400;
        const ratio = img.width / img.height;
        const w = ratio > 1 ? maxSide : maxSide * ratio;
        const h = ratio > 1 ? maxSide / ratio : maxSide;
        const node: SceneNode = {
          id: uid(),
          type: "image",
          x: world.x - w / 2,
          y: world.y - h / 2,
          w,
          h,
          src,
          color: "#000",
          layerId: state.activeLayerId,
        };
        commit([...state.nodes, node]);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop images
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      for (const f of files) if (f.type.startsWith("image/")) insertImageFromFile(f);
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodes, state.camera, state.activeLayerId]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (editingText) return;
    if (state.frozen) return;
    if (e.button === 2) return; // handled by contextmenu
    (e.target as Element).setPointerCapture(e.pointerId);
    const world = toWorld(e.clientX, e.clientY);
    const tool = state.tool;
    const isPan = tool === "hand" || e.button === 1 || (e.button === 0 && e.altKey);

    setCtxMenu(null);

    if (tool === "laser") {
      setLaserPoints((p) => [...p, { x: e.clientX, y: e.clientY, t: performance.now() }]);
      interactionRef.current = { kind: "draw", startWorld: world };
      return;
    }
    if (tool === "spotlight") {
      setSpotlight({ x: e.clientX, y: e.clientY });
      interactionRef.current = { kind: "draw", startWorld: world };
      return;
    }

    if (isPan) {
      interactionRef.current = {
        kind: "pan",
        startClient: { x: e.clientX, y: e.clientY },
        startCamera: state.camera,
      };
      return;
    }

    if (tool === "marquee" || tool === "lasso") {
      interactionRef.current = { kind: "marquee", startWorld: world };
      setMarquee({ x: world.x, y: world.y, w: 0, h: 0 });
      setSelection(new Set());
      return;
    }

    if (tool === "select") {
      const hit = [...state.nodes]
        .reverse()
        .find((n) => !n.locked && hitTest(n, world.x, world.y));
      if (hit) {
        const sel = state.selection.has(hit.id)
          ? state.selection
          : new Set([hit.id]);
        setSelection(sel);
        const offsets = new Map<string, { dx: number; dy: number }>();
        for (const n of state.nodes) {
          if (sel.has(n.id)) offsets.set(n.id, { dx: 0, dy: 0 });
        }
        interactionRef.current = {
          kind: "move",
          startWorld: world,
          moveOffset: offsets,
          baseNodes: state.nodes,
        };
      } else {
        // Empty click starts marquee (Figma-style)
        interactionRef.current = { kind: "marquee", startWorld: world };
        setMarquee({ x: world.x, y: world.y, w: 0, h: 0 });
        setSelection(new Set());
      }
      return;
    }

    if (ERASER_TOOLS.has(tool)) {
      const hit = [...state.nodes]
        .reverse()
        .find((n) => hitTest(n, world.x, world.y, 8));
      if (hit) commit(state.nodes.filter((n) => n.id !== hit.id));
      interactionRef.current = { kind: "draw", startWorld: world };
      return;
    }

    if (STROKE_TOOLS.has(tool)) {
      const stroke: SceneNode = {
        id: uid(),
        type: "stroke",
        tool: tool as StrokeTool,
        color: state.color,
        opacity: state.opacity,
        size: state.size,
        points: [{ x: world.x, y: world.y, p: e.pressure || 0.5 }],
        layerId: state.activeLayerId,
      };
      interactionRef.current = { kind: "draw", activeNode: stroke, startWorld: world };
      setNodesLive([...state.nodes, stroke]);
      return;
    }

    if (tool === "text") {
      const node: SceneNode = {
        id: uid(),
        type: "text",
        x: world.x,
        y: world.y,
        text: "",
        size: Math.max(14, state.size * 6),
        color: state.color,
        opacity: state.opacity,
        layerId: state.activeLayerId,
      };
      const nodes = [...state.nodes, node];
      commit(nodes);
      setEditingText({ id: node.id, screenX: e.clientX, screenY: e.clientY });
      return;
    }

    if (tool === "sticky") {
      const w = 200,
        h = 160;
      const node: SceneNode = {
        id: uid(),
        type: "sticky",
        x: world.x - w / 2,
        y: world.y - h / 2,
        w,
        h,
        text: "",
        color: "#FEF3A6",
        layerId: state.activeLayerId,
      };
      commit([...state.nodes, node]);
      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = (node.x + 12) * state.camera.zoom + state.camera.x + rect.left;
      const sy = (node.y + 12) * state.camera.zoom + state.camera.y + rect.top;
      setEditingText({ id: node.id, screenX: sx, screenY: sy });
      return;
    }

    if (tool === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const f = input.files?.[0];
        if (f) insertImageFromFile(f);
      };
      input.click();
      wb.setTool("select");
      return;
    }

    // Rect / rounded / ellipse / polygons / frame  → drag-to-size
    const polyKinds: ToolId[] = [
      "rect",
      "roundedRect",
      "ellipse",
      "triangle",
      "diamond",
      "pentagon",
      "hexagon",
      "star",
      "heart",
      "cloud",
      "frame",
    ];
    if (polyKinds.includes(tool)) {
      const base: any = {
        id: uid(),
        x: world.x,
        y: world.y,
        w: 0,
        h: 0,
        color: state.color,
        opacity: state.opacity,
        dash: state.dash,
        size: state.size,
        fill: state.fill,
        layerId: state.activeLayerId,
      };
      if (tool === "roundedRect") base.cornerRadius = state.cornerRadius;
      if (tool === "frame") {
        base.type = "frame";
        base.name = `Frame ${state.nodes.filter((n) => n.type === "frame").length + 1}`;
        base.color = "#94A3B8";
      } else {
        base.type = tool;
      }
      interactionRef.current = { kind: "shape", activeNode: base, startWorld: world };
      setNodesLive([...state.nodes, base]);
      return;
    }

    // Line / arrow variants
    const lineKinds: ToolId[] = ["line", "arrow", "doubleArrow", "curvedArrow"];
    if (lineKinds.includes(tool)) {
      const node: SceneNode = {
        id: uid(),
        type: tool as any,
        x1: world.x,
        y1: world.y,
        x2: world.x,
        y2: world.y,
        color: state.color,
        opacity: state.opacity,
        dash: state.dash,
        size: state.size,
        layerId: state.activeLayerId,
      } as SceneNode;
      interactionRef.current = { kind: "shape", activeNode: node, startWorld: world };
      setNodesLive([...state.nodes, node]);
      return;
    }

    if (tool === "connectorStraight" || tool === "connectorElbow" || tool === "connectorCurved") {
      const variant =
        tool === "connectorElbow" ? "elbow" : tool === "connectorCurved" ? "curved" : "straight";
      const node: SceneNode = {
        id: uid(),
        type: "connector",
        variant,
        x1: world.x,
        y1: world.y,
        x2: world.x,
        y2: world.y,
        color: state.color,
        opacity: state.opacity,
        dash: state.dash,
        size: state.size,
        arrowEnd: true,
        layerId: state.activeLayerId,
      };
      interactionRef.current = { kind: "shape", activeNode: node, startWorld: world };
      setNodesLive([...state.nodes, node]);
      return;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const it = interactionRef.current;

    // Laser trail while active
    if (state.tool === "laser") {
      setLaserPoints((p) => [...p, { x: e.clientX, y: e.clientY, t: performance.now() }]);
    }
    if (state.tool === "spotlight") {
      setSpotlight({ x: e.clientX, y: e.clientY });
    }

    if (it.kind === "none") return;
    const world = toWorld(e.clientX, e.clientY);

    if (it.kind === "pan" && it.startClient && it.startCamera) {
      const dx = e.clientX - it.startClient.x;
      const dy = e.clientY - it.startClient.y;
      setCamera(() => ({
        ...it.startCamera!,
        x: it.startCamera!.x + dx,
        y: it.startCamera!.y + dy,
      }));
      return;
    }

    if (it.kind === "marquee" && it.startWorld) {
      const x = Math.min(it.startWorld.x, world.x);
      const y = Math.min(it.startWorld.y, world.y);
      const w = Math.abs(world.x - it.startWorld.x);
      const h = Math.abs(world.y - it.startWorld.y);
      setMarquee({ x, y, w, h });
      return;
    }

    if (it.kind === "move" && it.startWorld && it.moveOffset && it.baseNodes) {
      const dx = world.x - it.startWorld.x;
      const dy = world.y - it.startWorld.y;
      const snap = (v: number) => (state.snapToGrid ? Math.round(v / 24) * 24 : v);
      const nodes = it.baseNodes.map((n) =>
        it.moveOffset!.has(n.id) ? translateNode(n, snap(dx), snap(dy)) : n,
      );
      setNodesLive(nodes);
      return;
    }

    if (it.kind === "draw") {
      const active = it.activeNode;
      if (active && active.type === "stroke") {
        active.points.push({ x: world.x, y: world.y, p: e.pressure || 0.5 });
        setNodesLive([...state.nodes.slice(0, -1), active]);
      } else if (ERASER_TOOLS.has(state.tool)) {
        const hit = [...state.nodes]
          .reverse()
          .find((n) => hitTest(n, world.x, world.y, 8));
        if (hit) commit(state.nodes.filter((n) => n.id !== hit.id));
      }
      return;
    }

    if (it.kind === "shape" && it.startWorld && it.activeNode) {
      const start = it.startWorld;
      const shift = e.shiftKey;
      let updated: SceneNode;
      const a: any = it.activeNode;
      if ("w" in a) {
        let w = world.x - start.x;
        let h = world.y - start.y;
        if (shift) {
          const s = Math.min(Math.abs(w), Math.abs(h));
          w = Math.sign(w) * s;
          h = Math.sign(h) * s;
        }
        const x = w < 0 ? start.x + w : start.x;
        const y = h < 0 ? start.y + h : start.y;
        updated = { ...a, x, y, w: Math.abs(w), h: Math.abs(h) } as SceneNode;
      } else {
        updated = { ...a, x2: world.x, y2: world.y } as SceneNode;
      }
      it.activeNode = updated;
      setNodesLive([...state.nodes.slice(0, -1), updated]);
      return;
    }
  };

  const onPointerUp = () => {
    const it = interactionRef.current;
    if (it.kind === "draw" && it.activeNode) {
      commit(state.nodes);
    } else if (it.kind === "shape" && it.activeNode) {
      commit(state.nodes);
    } else if (it.kind === "move") {
      commit(state.nodes);
    } else if (it.kind === "marquee" && marquee) {
      const sel = new Set(
        state.nodes.filter((n) => !n.locked && nodeInRect(n, marquee)).map((n) => n.id),
      );
      setSelection(sel);
      setMarquee(null);
    }
    interactionRef.current = { kind: "none" };
  };

  // Laser fade
  useEffect(() => {
    if (state.tool !== "laser" && !laserPoints.length) return;
    const id = setInterval(() => {
      const now = performance.now();
      setLaserPoints((pts) => pts.filter((p) => now - p.t < 900));
    }, 60);
    return () => clearInterval(id);
  }, [state.tool, laserPoints.length]);

  // Reset spotlight when tool changes away
  useEffect(() => {
    if (state.tool !== "spotlight") setSpotlight(null);
    if (state.tool !== "laser") setLaserPoints([]);
  }, [state.tool]);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const world = toWorld(e.clientX, e.clientY);
    const hit = [...state.nodes].reverse().find((n) => hitTest(n, world.x, world.y));
    if (hit && !state.selection.has(hit.id)) setSelection(new Set([hit.id]));
    setCtxMenu({ x: e.clientX, y: e.clientY, hasSelection: !!hit || state.selection.size > 0 });
  };

  const finishTextEdit = (value: string) => {
    if (!editingText) return;
    if (!value.trim()) {
      commit(state.nodes.filter((n) => n.id !== editingText.id));
    } else {
      commit(
        state.nodes.map((n) =>
          n.id === editingText.id ? ({ ...n, text: value } as SceneNode) : n,
        ),
      );
    }
    setEditingText(null);
  };

  const themeClass =
    state.theme === "dark"
      ? "dark bg-background"
      : state.theme === "chalk"
        ? "wb-chalkboard"
        : "bg-background";
  const gridClass =
    state.grid === "dots" ? "wb-grid-dots" : state.grid === "lines" ? "wb-grid-lines" : "";

  const editingNode = editingText ? state.nodes.find((n) => n.id === editingText.id) : null;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${themeClass} ${gridClass}`}
      style={
        state.grid !== "none"
          ? {
              backgroundPosition: `${state.camera.x % (24 * state.camera.zoom)}px ${
                state.camera.y % (24 * state.camera.zoom)
              }px`,
              backgroundSize: `${24 * state.camera.zoom}px ${24 * state.camera.zoom}px`,
            }
          : undefined
      }
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={onContextMenu}
        className="block h-full w-full touch-none"
        style={{ cursor: cursorFor(state.tool) }}
      />
      {editingText && editingNode && (editingNode.type === "text" || editingNode.type === "sticky") && (
        <TextEditor
          initial={editingNode.text}
          x={editingText.screenX}
          y={editingText.screenY}
          isSticky={editingNode.type === "sticky"}
          onDone={finishTextEdit}
        />
      )}
      <LaserOverlay points={laserPoints} />
      <SpotlightOverlay center={spotlight} />
      {ctxMenu && (
        <ContextMenu
          state={ctxMenu}
          hasSelection={state.selection.size > 0}
          onClose={() => setCtxMenu(null)}
          actions={{
            copy,
            cut,
            paste,
            duplicate,
            deleteSelection,
            bringForward: () => arrange("forward"),
            bringToFront: () => arrange("front"),
            sendBackward: () => arrange("backward"),
            sendToBack: () => arrange("back"),
            toggleLock,
          }}
        />
      )}
      {state.screenOverlay !== "none" && (
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{ background: state.screenOverlay === "black" ? "#000" : "#fff" }}
        />
      )}
    </div>
  );
}

function cursorFor(tool: ToolId): string {
  if (tool === "hand") return "grab";
  if (tool === "select" || tool === "marquee" || tool === "lasso") return "default";
  if (tool === "text") return "text";
  if (tool === "laser" || tool === "spotlight") return "none";
  return "crosshair";
}

function zoomAt(
  c: Camera,
  factor: number,
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): Camera {
  const rect = canvas.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const nextZoom = Math.max(0.1, Math.min(6, c.zoom * factor));
  const scale = nextZoom / c.zoom;
  const x = px - (px - c.x) * scale;
  const y = py - (py - c.y) * scale;
  return { x, y, zoom: nextZoom };
}

function TextEditor({
  initial,
  x,
  y,
  isSticky,
  onDone,
}: {
  initial: string;
  x: number;
  y: number;
  isSticky: boolean;
  onDone: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") onDone(value);
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onDone(value);
      }}
      style={{
        position: "fixed",
        left: x,
        top: y,
        minWidth: isSticky ? 180 : 120,
        minHeight: isSticky ? 100 : 32,
        padding: 4,
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        background: isSticky ? "#FEF3A6" : "var(--color-background)",
        color: "#1a1a1a",
        font: "500 15px Inter, system-ui, sans-serif",
        outline: "none",
        resize: "both",
        zIndex: 50,
      }}
    />
  );
}
