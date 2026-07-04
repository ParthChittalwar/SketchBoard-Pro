// Z-order, alignment, distribute, flip helpers.
import type { SceneNode } from "./scene";
import { nodeBounds, translateNode } from "./scene";

export function bringForward(nodes: SceneNode[], ids: Set<string>): SceneNode[] {
  const out = nodes.slice();
  for (let i = out.length - 2; i >= 0; i--) {
    if (ids.has(out[i].id) && !ids.has(out[i + 1].id)) {
      [out[i], out[i + 1]] = [out[i + 1], out[i]];
    }
  }
  return out;
}
export function sendBackward(nodes: SceneNode[], ids: Set<string>): SceneNode[] {
  const out = nodes.slice();
  for (let i = 1; i < out.length; i++) {
    if (ids.has(out[i].id) && !ids.has(out[i - 1].id)) {
      [out[i], out[i - 1]] = [out[i - 1], out[i]];
    }
  }
  return out;
}
export function bringToFront(nodes: SceneNode[], ids: Set<string>): SceneNode[] {
  const stay = nodes.filter((n) => !ids.has(n.id));
  const move = nodes.filter((n) => ids.has(n.id));
  return [...stay, ...move];
}
export function sendToBack(nodes: SceneNode[], ids: Set<string>): SceneNode[] {
  const stay = nodes.filter((n) => !ids.has(n.id));
  const move = nodes.filter((n) => ids.has(n.id));
  return [...move, ...stay];
}

export type AlignKind =
  | "left"
  | "center-x"
  | "right"
  | "top"
  | "center-y"
  | "bottom";

export function alignSelection(
  nodes: SceneNode[],
  ids: Set<string>,
  kind: AlignKind,
): SceneNode[] {
  if (ids.size < 2) return nodes;
  const sel = nodes.filter((n) => ids.has(n.id));
  const bs = sel.map((n) => nodeBounds(n));
  const minX = Math.min(...bs.map((b) => b.x));
  const maxX = Math.max(...bs.map((b) => b.x + b.w));
  const minY = Math.min(...bs.map((b) => b.y));
  const maxY = Math.max(...bs.map((b) => b.y + b.h));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return nodes.map((n) => {
    if (!ids.has(n.id)) return n;
    const b = nodeBounds(n);
    let dx = 0,
      dy = 0;
    switch (kind) {
      case "left":
        dx = minX - b.x;
        break;
      case "right":
        dx = maxX - (b.x + b.w);
        break;
      case "center-x":
        dx = cx - (b.x + b.w / 2);
        break;
      case "top":
        dy = minY - b.y;
        break;
      case "bottom":
        dy = maxY - (b.y + b.h);
        break;
      case "center-y":
        dy = cy - (b.y + b.h / 2);
        break;
    }
    return translateNode(n, dx, dy);
  });
}

export function distributeSelection(
  nodes: SceneNode[],
  ids: Set<string>,
  axis: "x" | "y",
): SceneNode[] {
  if (ids.size < 3) return nodes;
  const sel = nodes.filter((n) => ids.has(n.id));
  const withB = sel.map((n) => ({ n, b: nodeBounds(n) }));
  withB.sort((a, b) => (axis === "x" ? a.b.x - b.b.x : a.b.y - b.b.y));
  const first = withB[0].b;
  const last = withB[withB.length - 1].b;
  const startCenter = axis === "x" ? first.x + first.w / 2 : first.y + first.h / 2;
  const endCenter = axis === "x" ? last.x + last.w / 2 : last.y + last.h / 2;
  const step = (endCenter - startCenter) / (withB.length - 1);
  const moves = new Map<string, { dx: number; dy: number }>();
  withB.forEach((it, i) => {
    const targetCenter = startCenter + step * i;
    const currentCenter =
      axis === "x" ? it.b.x + it.b.w / 2 : it.b.y + it.b.h / 2;
    const delta = targetCenter - currentCenter;
    moves.set(it.n.id, axis === "x" ? { dx: delta, dy: 0 } : { dx: 0, dy: delta });
  });
  return nodes.map((n) => {
    const m = moves.get(n.id);
    if (!m) return n;
    return translateNode(n, m.dx, m.dy);
  });
}

export function flipSelection(
  nodes: SceneNode[],
  ids: Set<string>,
  axis: "h" | "v",
): SceneNode[] {
  return nodes.map((n) => {
    if (!ids.has(n.id)) return n;
    if (n.type === "image") return { ...n, [axis === "h" ? "flipX" : "flipY"]: !(axis === "h" ? n.flipX : n.flipY) };
    // Generic: rotate 180° across axis by mirroring around center
    const b = nodeBounds(n);
    if (n.type === "stroke") {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      return {
        ...n,
        points: n.points.map((p) => ({
          ...p,
          x: axis === "h" ? cx - (p.x - cx) : p.x,
          y: axis === "v" ? cy - (p.y - cy) : p.y,
        })),
      };
    }
    if (
      n.type === "line" ||
      n.type === "arrow" ||
      n.type === "doubleArrow" ||
      n.type === "curvedArrow" ||
      n.type === "connector"
    ) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      return {
        ...n,
        x1: axis === "h" ? cx - (n.x1 - cx) : n.x1,
        x2: axis === "h" ? cx - (n.x2 - cx) : n.x2,
        y1: axis === "v" ? cy - (n.y1 - cy) : n.y1,
        y2: axis === "v" ? cy - (n.y2 - cy) : n.y2,
      };
    }
    return n;
  });
}
