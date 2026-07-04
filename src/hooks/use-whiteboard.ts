import { useCallback, useEffect, useRef, useState } from "react";
import type { Camera, Layer, SceneNode, ToolId, DashStyle } from "@/lib/whiteboard/scene";
import { DEFAULT_LAYER_ID, uid } from "@/lib/whiteboard/scene";
import {
  bringForward,
  bringToFront,
  sendBackward,
  sendToBack,
  alignSelection,
  distributeSelection,
  flipSelection,
  type AlignKind,
} from "@/lib/whiteboard/arrange";
import {
  applyStyleClipboard,
  duplicateNodes,
  getClipboard,
  setClipboard,
  setStyleClipboard,
} from "@/lib/whiteboard/clipboard";

const STORAGE_KEY = "wbpro:scene:v2";

export interface WhiteboardState {
  tool: ToolId;
  color: string;
  size: number;
  fill: string | null;
  opacity: number;
  dash: DashStyle;
  cornerRadius: number;
  nodes: SceneNode[];
  camera: Camera;
  selection: Set<string>;
  theme: "light" | "dark" | "chalk";
  grid: "none" | "dots" | "lines";
  layers: Layer[];
  activeLayerId: string;
  snapToGrid: boolean;
  presentation: boolean;
  hideToolbar: boolean;
  frozen: boolean;
  screenOverlay: "none" | "black" | "white";
}

const defaultLayer: Layer = {
  id: DEFAULT_LAYER_ID,
  name: "Layer 1",
  visible: true,
  locked: false,
};

const defaultState: WhiteboardState = {
  tool: "pen",
  color: "#1a1a1a",
  size: 3,
  fill: null,
  opacity: 1,
  dash: "solid",
  cornerRadius: 12,
  nodes: [],
  camera: { x: 0, y: 0, zoom: 1 },
  selection: new Set(),
  theme: "light",
  grid: "dots",
  layers: [defaultLayer],
  activeLayerId: DEFAULT_LAYER_ID,
  snapToGrid: false,
  presentation: false,
  hideToolbar: false,
  frozen: false,
  screenOverlay: "none",
};

interface HistoryEntry {
  nodes: SceneNode[];
}

export function useWhiteboard() {
  const [state, setState] = useState<WhiteboardState>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaultState,
          ...parsed,
          selection: new Set<string>(),
          camera: parsed.camera ?? defaultState.camera,
          layers: parsed.layers?.length ? parsed.layers : [defaultLayer],
          activeLayerId: parsed.activeLayerId ?? DEFAULT_LAYER_ID,
        };
      }
    } catch {
      /* ignore */
    }
    return defaultState;
  });

  const historyRef = useRef<HistoryEntry[]>([{ nodes: state.nodes }]);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            nodes: state.nodes,
            camera: state.camera,
            theme: state.theme,
            grid: state.grid,
            layers: state.layers,
            activeLayerId: state.activeLayerId,
          }),
        );
      } catch {
        /* quota */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [state.nodes, state.camera, state.theme, state.grid, state.layers, state.activeLayerId]);

  const setTool = useCallback((tool: ToolId) => setState((s) => ({ ...s, tool })), []);
  const setColor = useCallback((color: string) => setState((s) => ({ ...s, color })), []);
  const setSize = useCallback((size: number) => setState((s) => ({ ...s, size })), []);
  const setFill = useCallback((fill: string | null) => setState((s) => ({ ...s, fill })), []);
  const setOpacity = useCallback((opacity: number) => setState((s) => ({ ...s, opacity })), []);
  const setDash = useCallback((dash: DashStyle) => setState((s) => ({ ...s, dash })), []);
  const setCornerRadius = useCallback(
    (cornerRadius: number) => setState((s) => ({ ...s, cornerRadius })),
    [],
  );
  const setCamera = useCallback(
    (updater: (c: Camera) => Camera) => setState((s) => ({ ...s, camera: updater(s.camera) })),
    [],
  );
  const setTheme = useCallback(
    (theme: WhiteboardState["theme"]) => setState((s) => ({ ...s, theme })),
    [],
  );
  const setGrid = useCallback(
    (grid: WhiteboardState["grid"]) => setState((s) => ({ ...s, grid })),
    [],
  );
  const setSelection = useCallback(
    (selection: Set<string>) => setState((s) => ({ ...s, selection })),
    [],
  );
  const setSnapToGrid = useCallback(
    (v: boolean) => setState((s) => ({ ...s, snapToGrid: v })),
    [],
  );
  const setPresentation = useCallback(
    (v: boolean) => setState((s) => ({ ...s, presentation: v })),
    [],
  );
  const setHideToolbar = useCallback(
    (v: boolean) => setState((s) => ({ ...s, hideToolbar: v })),
    [],
  );
  const setFrozen = useCallback((v: boolean) => setState((s) => ({ ...s, frozen: v })), []);
  const setScreenOverlay = useCallback(
    (v: WhiteboardState["screenOverlay"]) => setState((s) => ({ ...s, screenOverlay: v })),
    [],
  );

  const pushHistory = (nodes: SceneNode[]) => {
    const arr = historyRef.current.slice(0, historyIndexRef.current + 1);
    arr.push({ nodes });
    if (arr.length > 120) arr.shift();
    historyRef.current = arr;
    historyIndexRef.current = arr.length - 1;
  };

  const commit = useCallback((nodes: SceneNode[]) => {
    pushHistory(nodes);
    setState((s) => ({ ...s, nodes }));
  }, []);

  const setNodesLive = useCallback((nodes: SceneNode[]) => {
    setState((s) => ({ ...s, nodes }));
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const entry = historyRef.current[historyIndexRef.current];
      setState((s) => ({ ...s, nodes: entry.nodes, selection: new Set() }));
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const entry = historyRef.current[historyIndexRef.current];
      setState((s) => ({ ...s, nodes: entry.nodes, selection: new Set() }));
    }
  }, []);

  const clear = useCallback(() => commit([]), [commit]);

  const deleteSelection = useCallback(() => {
    setState((s) => {
      if (!s.selection.size) return s;
      const nodes = s.nodes.filter((n) => !s.selection.has(n.id));
      pushHistory(nodes);
      return { ...s, nodes, selection: new Set() };
    });
  }, []);

  // Clipboard actions
  const copy = useCallback(() => {
    setState((s) => {
      const sel = s.nodes.filter((n) => s.selection.has(n.id));
      if (sel.length) setClipboard(sel);
      return s;
    });
  }, []);
  const cut = useCallback(() => {
    setState((s) => {
      const sel = s.nodes.filter((n) => s.selection.has(n.id));
      if (!sel.length) return s;
      setClipboard(sel);
      const nodes = s.nodes.filter((n) => !s.selection.has(n.id));
      pushHistory(nodes);
      return { ...s, nodes, selection: new Set() };
    });
  }, []);
  const paste = useCallback(() => {
    setState((s) => {
      const pasted = getClipboard();
      if (!pasted.length) return s;
      const shifted = pasted.map((n) => {
        // apply 24px offset generically
        if ("x" in n && "y" in n)
          return { ...(n as any), x: (n as any).x + 24, y: (n as any).y + 24 };
        if ("x1" in n)
          return {
            ...(n as any),
            x1: (n as any).x1 + 24,
            y1: (n as any).y1 + 24,
            x2: (n as any).x2 + 24,
            y2: (n as any).y2 + 24,
          };
        return n;
      }) as SceneNode[];
      const nodes = [...s.nodes, ...shifted];
      pushHistory(nodes);
      return { ...s, nodes, selection: new Set(shifted.map((n) => n.id)) };
    });
  }, []);
  const duplicate = useCallback(() => {
    setState((s) => {
      const sel = s.nodes.filter((n) => s.selection.has(n.id));
      if (!sel.length) return s;
      const dup = duplicateNodes(sel);
      const nodes = [...s.nodes, ...dup];
      pushHistory(nodes);
      return { ...s, nodes, selection: new Set(dup.map((n) => n.id)) };
    });
  }, []);

  const copyStyle = useCallback(() => {
    setState((s) => {
      const first = s.nodes.find((n) => s.selection.has(n.id));
      if (first) setStyleClipboard(first);
      return s;
    });
  }, []);
  const pasteStyle = useCallback(() => {
    setState((s) => {
      if (!s.selection.size) return s;
      const nodes = s.nodes.map((n) => (s.selection.has(n.id) ? applyStyleClipboard(n) : n));
      pushHistory(nodes);
      return { ...s, nodes };
    });
  }, []);

  // Arrange
  const arrange = useCallback(
    (kind: "front" | "back" | "forward" | "backward") =>
      setState((s) => {
        if (!s.selection.size) return s;
        const fn =
          kind === "front"
            ? bringToFront
            : kind === "back"
              ? sendToBack
              : kind === "forward"
                ? bringForward
                : sendBackward;
        const nodes = fn(s.nodes, s.selection);
        pushHistory(nodes);
        return { ...s, nodes };
      }),
    [],
  );

  const align = useCallback(
    (kind: AlignKind) =>
      setState((s) => {
        const nodes = alignSelection(s.nodes, s.selection, kind);
        pushHistory(nodes);
        return { ...s, nodes };
      }),
    [],
  );
  const distribute = useCallback(
    (axis: "x" | "y") =>
      setState((s) => {
        const nodes = distributeSelection(s.nodes, s.selection, axis);
        pushHistory(nodes);
        return { ...s, nodes };
      }),
    [],
  );
  const flip = useCallback(
    (axis: "h" | "v") =>
      setState((s) => {
        const nodes = flipSelection(s.nodes, s.selection, axis);
        pushHistory(nodes);
        return { ...s, nodes };
      }),
    [],
  );

  const toggleLock = useCallback(() => {
    setState((s) => {
      if (!s.selection.size) return s;
      const nodes = s.nodes.map((n) =>
        s.selection.has(n.id) ? ({ ...n, locked: !n.locked } as SceneNode) : n,
      );
      pushHistory(nodes);
      return { ...s, nodes };
    });
  }, []);

  // Layers
  const addLayer = useCallback(() => {
    setState((s) => {
      const layer: Layer = {
        id: uid(),
        name: `Layer ${s.layers.length + 1}`,
        visible: true,
        locked: false,
      };
      return { ...s, layers: [...s.layers, layer], activeLayerId: layer.id };
    });
  }, []);
  const updateLayer = useCallback(
    (id: string, patch: Partial<Layer>) =>
      setState((s) => ({
        ...s,
        layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })),
    [],
  );
  const removeLayer = useCallback(
    (id: string) =>
      setState((s) => {
        if (s.layers.length <= 1) return s;
        const layers = s.layers.filter((l) => l.id !== id);
        const nodes = s.nodes.filter((n) => n.layerId !== id);
        pushHistory(nodes);
        return {
          ...s,
          layers,
          nodes,
          activeLayerId: layers[0].id,
          selection: new Set(),
        };
      }),
    [],
  );
  const setActiveLayer = useCallback(
    (id: string) => setState((s) => ({ ...s, activeLayerId: id })),
    [],
  );

  const importJSON = useCallback((data: { nodes?: SceneNode[] }) => {
    if (!data?.nodes || !Array.isArray(data.nodes)) return;
    commit(data.nodes);
  }, [commit]);

  return {
    state,
    setTool,
    setColor,
    setSize,
    setFill,
    setOpacity,
    setDash,
    setCornerRadius,
    setCamera,
    setTheme,
    setGrid,
    setSelection,
    setSnapToGrid,
    setPresentation,
    setHideToolbar,
    setFrozen,
    setScreenOverlay,
    commit,
    setNodesLive,
    undo,
    redo,
    clear,
    deleteSelection,
    // clipboard
    copy,
    cut,
    paste,
    duplicate,
    copyStyle,
    pasteStyle,
    // arrange
    arrange,
    align,
    distribute,
    flip,
    toggleLock,
    // layers
    addLayer,
    updateLayer,
    removeLayer,
    setActiveLayer,
    // io
    importJSON,
  };
}
