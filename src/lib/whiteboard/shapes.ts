// Path builders for parametric shapes. All in world space, produce an array
// of points describing a closed polygon or use Path2D for curved shapes.
import type { PolyShapeKind } from "./scene";

/** Build a closed polygon path for a shape inside the given box. */
export function shapePath(
  kind: PolyShapeKind,
  x: number,
  y: number,
  w: number,
  h: number,
): Path2D {
  const p = new Path2D();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;

  switch (kind) {
    case "triangle": {
      p.moveTo(cx, y);
      p.lineTo(x + w, y + h);
      p.lineTo(x, y + h);
      p.closePath();
      break;
    }
    case "diamond": {
      p.moveTo(cx, y);
      p.lineTo(x + w, cy);
      p.lineTo(cx, y + h);
      p.lineTo(x, cy);
      p.closePath();
      break;
    }
    case "pentagon":
      regularPoly(p, cx, cy, rx, ry, 5, -Math.PI / 2);
      break;
    case "hexagon":
      regularPoly(p, cx, cy, rx, ry, 6, 0);
      break;
    case "star":
      starPath(p, cx, cy, rx, ry, 5, 0.45);
      break;
    case "heart":
      heartPath(p, x, y, w, h);
      break;
    case "cloud":
      cloudPath(p, x, y, w, h);
      break;
  }
  return p;
}

function regularPoly(
  p: Path2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  sides: number,
  rot: number,
) {
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * Math.PI * 2) / sides;
    const px = cx + rx * Math.cos(a);
    const py = cy + ry * Math.sin(a);
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.closePath();
}

function starPath(
  p: Path2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  points: number,
  innerRatio: number,
) {
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 1 : innerRatio;
    const a = -Math.PI / 2 + i * step;
    const px = cx + rx * r * Math.cos(a);
    const py = cy + ry * r * Math.sin(a);
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.closePath();
}

function heartPath(p: Path2D, x: number, y: number, w: number, h: number) {
  const topY = y + h * 0.28;
  p.moveTo(x + w / 2, y + h);
  p.bezierCurveTo(x - w * 0.1, y + h * 0.55, x + w * 0.15, y - h * 0.05, x + w / 2, topY);
  p.bezierCurveTo(
    x + w * 0.85,
    y - h * 0.05,
    x + w * 1.1,
    y + h * 0.55,
    x + w / 2,
    y + h,
  );
  p.closePath();
}

function cloudPath(p: Path2D, x: number, y: number, w: number, h: number) {
  const cy = y + h * 0.6;
  const r1 = h * 0.35;
  const r2 = h * 0.42;
  const r3 = h * 0.32;
  p.moveTo(x + r1, cy);
  p.arc(x + w * 0.25, cy - r1 * 0.2, r1, Math.PI * 0.5, Math.PI * 1.5);
  p.arc(x + w * 0.5, y + h * 0.35, r2, Math.PI, Math.PI * 2);
  p.arc(x + w * 0.78, cy - r3 * 0.2, r3, Math.PI * 1.5, Math.PI * 0.5);
  p.lineTo(x + w * 0.78, cy + r3);
  p.arc(x + w * 0.55, cy + r3 * 0.5, r2 * 0.9, 0, Math.PI);
  p.arc(x + w * 0.25, cy + r1 * 0.4, r1, 0, Math.PI);
  p.closePath();
}

/** Build an SVG path 'd' attribute equivalent for export. */
export function shapePathD(
  kind: PolyShapeKind,
  x: number,
  y: number,
  w: number,
  h: number,
): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  if (kind === "triangle") return `M${cx} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
  if (kind === "diamond") return `M${cx} ${y} L${x + w} ${cy} L${cx} ${y + h} L${x} ${cy} Z`;
  if (kind === "pentagon") return regularPolyD(cx, cy, rx, ry, 5, -Math.PI / 2);
  if (kind === "hexagon") return regularPolyD(cx, cy, rx, ry, 6, 0);
  if (kind === "star") return starPathD(cx, cy, rx, ry, 5, 0.45);
  if (kind === "heart") {
    const topY = y + h * 0.28;
    return `M${x + w / 2} ${y + h} C${x - w * 0.1} ${y + h * 0.55}, ${x + w * 0.15} ${y - h * 0.05}, ${x + w / 2} ${topY} C${x + w * 0.85} ${y - h * 0.05}, ${x + w * 1.1} ${y + h * 0.55}, ${x + w / 2} ${y + h} Z`;
  }
  // cloud → simple rounded rect approximation for SVG export
  return `M${x} ${y + h * 0.5} Q${x} ${y}, ${x + w * 0.5} ${y} Q${x + w} ${y}, ${x + w} ${y + h * 0.5} Q${x + w} ${y + h}, ${x + w * 0.5} ${y + h} Q${x} ${y + h}, ${x} ${y + h * 0.5} Z`;
}

function regularPolyD(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  sides: number,
  rot: number,
) {
  const parts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * Math.PI * 2) / sides;
    parts.push(`${i === 0 ? "M" : "L"}${cx + rx * Math.cos(a)} ${cy + ry * Math.sin(a)}`);
  }
  return parts.join(" ") + " Z";
}

function starPathD(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  points: number,
  innerRatio: number,
) {
  const step = Math.PI / points;
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 1 : innerRatio;
    const a = -Math.PI / 2 + i * step;
    parts.push(`${i === 0 ? "M" : "L"}${cx + rx * r * Math.cos(a)} ${cy + ry * r * Math.sin(a)}`);
  }
  return parts.join(" ") + " Z";
}
