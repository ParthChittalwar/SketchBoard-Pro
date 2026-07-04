// Whiteboard scene types and helpers.
// All coordinates are world-space (unaffected by camera zoom/pan).

export type ToolId =
  // selection & nav
  | "select"
  | "marquee"
  | "lasso"
  | "hand"
  // draw
  | "pen"
  | "smoothPen"
  | "pencil"
  | "marker"
  | "brush"
  | "highlighter"
  | "chalk"
  | "calligraphy"
  | "fountain"
  // erasers
  | "eraser"
  | "strokeEraser"
  | "objectEraser"
  // shapes
  | "rect"
  | "roundedRect"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "star"
  | "heart"
  | "cloud"
  | "line"
  | "arrow"
  | "doubleArrow"
  | "curvedArrow"
  // text/media
  | "text"
  | "sticky"
  | "image"
  | "frame"
  // connectors
  | "connectorStraight"
  | "connectorElbow"
  | "connectorCurved"
  // teach
  | "laser"
  | "spotlight";

export type Point = { x: number; y: number; p?: number };

export type DashStyle = "solid" | "dashed" | "dotted";

export interface BaseNode {
  id: string;
  type: string;
  color: string;
  opacity?: number;
  rotation?: number; // radians
  dash?: DashStyle;
  locked?: boolean;
  layerId?: string;
}

export type StrokeTool =
  | "pen"
  | "smoothPen"
  | "pencil"
  | "highlighter"
  | "marker"
  | "brush"
  | "chalk"
  | "calligraphy"
  | "fountain";

export interface StrokeNode extends BaseNode {
  type: "stroke";
  tool: StrokeTool;
  size: number;
  points: Point[];
}

export type PolyShapeKind =
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "star"
  | "heart"
  | "cloud";

export interface ShapeNode extends BaseNode {
  type: "rect" | "roundedRect" | "ellipse" | PolyShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  cornerRadius?: number;
  fill?: string | null;
}

export interface LineNode extends BaseNode {
  type: "line" | "arrow" | "doubleArrow" | "curvedArrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  size: number;
}

export interface ConnectorNode extends BaseNode {
  type: "connector";
  variant: "straight" | "elbow" | "curved";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  size: number;
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface TextNode extends BaseNode {
  type: "text";
  x: number;
  y: number;
  text: string;
  size: number;
  fontFamily?: string;
  weight?: number;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
}

export interface StickyNode extends BaseNode {
  type: "sticky";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}

export interface ImageNode extends BaseNode {
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  src: string; // data URL or remote URL
  flipX?: boolean;
  flipY?: boolean;
}

export interface FrameNode extends BaseNode {
  type: "frame";
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
}

export type SceneNode =
  | StrokeNode
  | ShapeNode
  | LineNode
  | ConnectorNode
  | TextNode
  | StickyNode
  | ImageNode
  | FrameNode;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface Scene {
  nodes: SceneNode[];
}

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const DEFAULT_LAYER_ID = "default";

/** Bounding box for a single node (world space, ignoring rotation). */
export function nodeBounds(n: SceneNode): { x: number; y: number; w: number; h: number } {
  switch (n.type) {
    case "stroke": {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of n.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const pad = n.size / 2 + 2;
      return {
        x: minX - pad,
        y: minY - pad,
        w: maxX - minX + pad * 2,
        h: maxY - minY + pad * 2,
      };
    }
    case "rect":
    case "roundedRect":
    case "ellipse":
    case "triangle":
    case "diamond":
    case "pentagon":
    case "hexagon":
    case "star":
    case "heart":
    case "cloud":
    case "sticky":
    case "image":
    case "frame":
      return { x: n.x, y: n.y, w: n.w, h: n.h };
    case "line":
    case "arrow":
    case "doubleArrow":
    case "curvedArrow":
    case "connector": {
      const x = Math.min(n.x1, n.x2);
      const y = Math.min(n.y1, n.y2);
      return { x, y, w: Math.abs(n.x2 - n.x1), h: Math.abs(n.y2 - n.y1) };
    }
    case "text":
      return {
        x: n.x,
        y: n.y - n.size,
        w: Math.max(40, n.text.length * n.size * 0.55),
        h: n.size * 1.4,
      };
  }
}

/** Hit-test a point against a node in world coords. */
export function hitTest(n: SceneNode, x: number, y: number, tolerance = 6): boolean {
  const b = nodeBounds(n);
  if (n.type === "stroke") {
    if (
      x < b.x - tolerance ||
      y < b.y - tolerance ||
      x > b.x + b.w + tolerance ||
      y > b.y + b.h + tolerance
    )
      return false;
    const t = tolerance + n.size / 2;
    for (let i = 1; i < n.points.length; i++) {
      const a = n.points[i - 1];
      const c = n.points[i];
      if (distToSegment(x, y, a.x, a.y, c.x, c.y) <= t) return true;
    }
    return false;
  }
  if (
    n.type === "line" ||
    n.type === "arrow" ||
    n.type === "doubleArrow" ||
    n.type === "curvedArrow" ||
    n.type === "connector"
  ) {
    return distToSegment(x, y, n.x1, n.y1, n.x2, n.y2) <= tolerance + n.size / 2;
  }
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

/** Rectangle marquee: node fully inside r? */
export function nodeInRect(
  n: SceneNode,
  r: { x: number; y: number; w: number; h: number },
): boolean {
  const b = nodeBounds(n);
  return b.x >= r.x && b.y >= r.y && b.x + b.w <= r.x + r.w && b.y + b.h <= r.y + r.h;
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return Math.hypot(px - qx, py - qy);
}

/** Translate a node by (dx, dy). Returns a new node. */
export function translateNode(n: SceneNode, dx: number, dy: number): SceneNode {
  switch (n.type) {
    case "stroke":
      return { ...n, points: n.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })) };
    case "line":
    case "arrow":
    case "doubleArrow":
    case "curvedArrow":
    case "connector":
      return { ...n, x1: n.x1 + dx, y1: n.y1 + dy, x2: n.x2 + dx, y2: n.y2 + dy };
    default:
      return { ...n, x: (n as any).x + dx, y: (n as any).y + dy } as SceneNode;
  }
}

/** Return the node's centroid in world coords. */
export function nodeCenter(n: SceneNode): { x: number; y: number } {
  const b = nodeBounds(n);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}
