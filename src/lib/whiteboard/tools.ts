// Tool registry — single source of truth for grouping, labels, shortcuts.
import type { ToolId } from "./scene";
import type { LucideIcon } from "lucide-react";
import {
  MousePointer2,
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowRight,
  ArrowLeftRight,
  Type,
  StickyNote,
  Brush,
  Triangle,
  Diamond,
  Hexagon,
  Pentagon,
  Star,
  Heart,
  Cloud,
  Image as ImageIcon,
  Frame,
  Route,
  Waypoints,
  Spline,
  MoveDiagonal,
  BoxSelect,
  Lasso,
  Zap,
  Focus,
  SquareDashed,
  PenTool,
  Feather,
  PencilRuler,
  Pencil,
} from "lucide-react";

export type ToolGroup =
  | "select"
  | "draw"
  | "eraser"
  | "shape"
  | "line"
  | "connector"
  | "text"
  | "media"
  | "teach";

export interface ToolDef {
  id: ToolId;
  group: ToolGroup;
  label: string;
  hint?: string; // keyboard shortcut
  icon: LucideIcon;
}

export const TOOLS: ToolDef[] = [
  // Selection & nav
  { id: "select", group: "select", label: "Select", hint: "V", icon: MousePointer2 },
  { id: "marquee", group: "select", label: "Rectangle Select", hint: "M", icon: BoxSelect },
  { id: "lasso", group: "select", label: "Lasso Select", icon: Lasso },
  { id: "hand", group: "select", label: "Hand", hint: "H", icon: Hand },

  // Draw
  { id: "pen", group: "draw", label: "Pen", hint: "P", icon: Pen },
  { id: "smoothPen", group: "draw", label: "Smooth Pen", icon: PenTool },
  { id: "pencil", group: "draw", label: "Pencil", icon: Pencil },
  { id: "marker", group: "draw", label: "Marker", hint: "B", icon: Brush },
  { id: "brush", group: "draw", label: "Brush", icon: PencilRuler },
  { id: "highlighter", group: "draw", label: "Highlighter", hint: "I", icon: Highlighter },
  { id: "chalk", group: "draw", label: "Chalk", icon: Feather },
  { id: "calligraphy", group: "draw", label: "Calligraphy", icon: Feather },
  { id: "fountain", group: "draw", label: "Fountain Pen", icon: PenTool },

  // Erasers
  { id: "eraser", group: "eraser", label: "Eraser", hint: "E", icon: Eraser },
  { id: "strokeEraser", group: "eraser", label: "Stroke Eraser", icon: Eraser },
  { id: "objectEraser", group: "eraser", label: "Object Eraser", icon: SquareDashed },

  // Shapes
  { id: "rect", group: "shape", label: "Rectangle", hint: "R", icon: Square },
  { id: "roundedRect", group: "shape", label: "Rounded Rectangle", icon: Square },
  { id: "ellipse", group: "shape", label: "Ellipse", hint: "O", icon: Circle },
  { id: "triangle", group: "shape", label: "Triangle", icon: Triangle },
  { id: "diamond", group: "shape", label: "Diamond", icon: Diamond },
  { id: "pentagon", group: "shape", label: "Pentagon", icon: Pentagon },
  { id: "hexagon", group: "shape", label: "Hexagon", icon: Hexagon },
  { id: "star", group: "shape", label: "Star", icon: Star },
  { id: "heart", group: "shape", label: "Heart", icon: Heart },
  { id: "cloud", group: "shape", label: "Cloud", icon: Cloud },

  // Lines / arrows
  { id: "line", group: "line", label: "Line", hint: "L", icon: Minus },
  { id: "arrow", group: "line", label: "Arrow", hint: "A", icon: ArrowRight },
  { id: "doubleArrow", group: "line", label: "Double Arrow", icon: ArrowLeftRight },
  { id: "curvedArrow", group: "line", label: "Curved Arrow", icon: Spline },

  // Connectors
  { id: "connectorStraight", group: "connector", label: "Connector", icon: Route },
  { id: "connectorElbow", group: "connector", label: "Elbow Connector", icon: Waypoints },
  { id: "connectorCurved", group: "connector", label: "Curved Connector", icon: Spline },

  // Text
  { id: "text", group: "text", label: "Text", hint: "T", icon: Type },
  { id: "sticky", group: "text", label: "Sticky Note", hint: "N", icon: StickyNote },

  // Media
  { id: "image", group: "media", label: "Image", icon: ImageIcon },
  { id: "frame", group: "media", label: "Frame", hint: "F", icon: Frame },

  // Teacher
  { id: "laser", group: "teach", label: "Laser Pointer", icon: Zap },
  { id: "spotlight", group: "teach", label: "Spotlight", icon: Focus },
];

export const TOOL_BY_ID: Record<ToolId, ToolDef> = TOOLS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<ToolId, ToolDef>,
);

export const TOOLS_BY_GROUP: Record<ToolGroup, ToolDef[]> = TOOLS.reduce(
  (acc, t) => {
    (acc[t.group] ||= []).push(t);
    return acc;
  },
  {} as Record<ToolGroup, ToolDef[]>,
);

/** Group primary/anchor tool shown on the collapsed toolbar (first of each group). */
export const GROUP_ORDER: ToolGroup[] = [
  "select",
  "draw",
  "eraser",
  "shape",
  "line",
  "connector",
  "text",
  "media",
  "teach",
];

export const GROUP_LABEL: Record<ToolGroup, string> = {
  select: "Select",
  draw: "Draw",
  eraser: "Erase",
  shape: "Shapes",
  line: "Lines",
  connector: "Connectors",
  text: "Text",
  media: "Media",
  teach: "Teach",
};

/** Stroke-tool render presets (opacity / size multiplier / cap style). */
export const STROKE_PRESETS: Record<
  string,
  { sizeMul: number; opacity: number; lineCap?: CanvasLineCap; jitter?: number }
> = {
  pen: { sizeMul: 1, opacity: 1, lineCap: "round" },
  smoothPen: { sizeMul: 1, opacity: 1, lineCap: "round" },
  pencil: { sizeMul: 0.9, opacity: 0.85, lineCap: "round" },
  marker: { sizeMul: 1.6, opacity: 0.95, lineCap: "round" },
  brush: { sizeMul: 2.2, opacity: 0.85, lineCap: "round" },
  highlighter: { sizeMul: 2.6, opacity: 0.35, lineCap: "butt" },
  chalk: { sizeMul: 1.4, opacity: 0.8, lineCap: "round", jitter: 0.4 },
  calligraphy: { sizeMul: 1.3, opacity: 1, lineCap: "square" },
  fountain: { sizeMul: 1.1, opacity: 1, lineCap: "round" },
};
