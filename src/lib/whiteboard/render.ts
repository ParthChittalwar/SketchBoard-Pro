import type { Camera, SceneNode, StrokeNode, ImageNode } from "./scene";
import { nodeBounds, nodeCenter } from "./scene";
import { shapePath, shapePathD } from "./shapes";
import { STROKE_PRESETS } from "./tools";

// Simple in-memory HTMLImageElement cache so images render immediately after
// the first decode. Keyed by data-URL / URL.
const imageCache = new Map<string, HTMLImageElement>();
export function getCachedImage(src: string, onReady?: () => void): HTMLImageElement | null {
  const hit = imageCache.get(src);
  if (hit && hit.complete && hit.naturalWidth > 0) return hit;
  if (!hit) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => onReady?.();
    img.src = src;
    imageCache.set(src, img);
  }
  return hit && hit.complete ? hit : null;
}

/** Draw the entire scene onto a 2D canvas context. */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  nodes: SceneNode[],
  camera: Camera,
  opts: {
    width: number;
    height: number;
    selectionIds?: Set<string>;
    theme?: "light" | "dark" | "chalk";
    onImageLoad?: () => void;
  } = { width: 0, height: 0 },
) {
  ctx.save();
  ctx.clearRect(0, 0, opts.width, opts.height);
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  for (const n of nodes) drawNode(ctx, n, opts.onImageLoad);

  if (opts.selectionIds && opts.selectionIds.size) {
    ctx.save();
    ctx.strokeStyle = "oklch(0.58 0.16 252)";
    ctx.lineWidth = 1.25 / camera.zoom;
    ctx.setLineDash([6 / camera.zoom, 4 / camera.zoom]);
    for (const n of nodes) {
      if (!opts.selectionIds.has(n.id)) continue;
      const b = nodeBounds(n);
      ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    }
    ctx.restore();
  }

  ctx.restore();
}

function applyDash(ctx: CanvasRenderingContext2D, dash: string | undefined, size: number) {
  if (dash === "dashed") ctx.setLineDash([size * 3, size * 2]);
  else if (dash === "dotted") ctx.setLineDash([1, size * 2]);
  else ctx.setLineDash([]);
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  n: SceneNode,
  onImageLoad?: () => void,
) {
  ctx.save();
  ctx.globalAlpha = n.opacity ?? 1;
  ctx.strokeStyle = n.color;
  ctx.fillStyle = n.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Rotation around node center
  if (n.rotation && n.type !== "stroke") {
    const c = nodeCenter(n);
    ctx.translate(c.x, c.y);
    ctx.rotate(n.rotation);
    ctx.translate(-c.x, -c.y);
  }

  switch (n.type) {
    case "stroke":
      drawStroke(ctx, n);
      break;
    case "rect": {
      ctx.lineWidth = n.size;
      applyDash(ctx, n.dash, n.size);
      if (n.fill) {
        ctx.fillStyle = n.fill;
        ctx.fillRect(n.x, n.y, n.w, n.h);
      }
      ctx.strokeRect(n.x, n.y, n.w, n.h);
      break;
    }
    case "roundedRect": {
      ctx.lineWidth = n.size;
      applyDash(ctx, n.dash, n.size);
      const r = Math.min(n.cornerRadius ?? 12, Math.abs(n.w) / 2, Math.abs(n.h) / 2);
      const path = new Path2D();
      roundRectPath(path, n.x, n.y, n.w, n.h, r);
      if (n.fill) {
        ctx.fillStyle = n.fill;
        ctx.fill(path);
      }
      ctx.stroke(path);
      break;
    }
    case "ellipse": {
      ctx.lineWidth = n.size;
      applyDash(ctx, n.dash, n.size);
      ctx.beginPath();
      ctx.ellipse(
        n.x + n.w / 2,
        n.y + n.h / 2,
        Math.abs(n.w / 2),
        Math.abs(n.h / 2),
        0,
        0,
        Math.PI * 2,
      );
      if (n.fill) {
        ctx.fillStyle = n.fill;
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "triangle":
    case "diamond":
    case "pentagon":
    case "hexagon":
    case "star":
    case "heart":
    case "cloud": {
      ctx.lineWidth = n.size;
      applyDash(ctx, n.dash, n.size);
      const p = shapePath(n.type, n.x, n.y, n.w, n.h);
      if (n.fill) {
        ctx.fillStyle = n.fill;
        ctx.fill(p);
      }
      ctx.stroke(p);
      break;
    }
    case "line": {
      ctx.lineWidth = n.size;
      applyDash(ctx, n.dash, n.size);
      ctx.beginPath();
      ctx.moveTo(n.x1, n.y1);
      ctx.lineTo(n.x2, n.y2);
      ctx.stroke();
      break;
    }
    case "arrow":
    case "doubleArrow":
    case "curvedArrow": {
      ctx.lineWidth = n.size;
      applyDash(ctx, n.dash, n.size);
      ctx.beginPath();
      if (n.type === "curvedArrow") {
        const mx = (n.x1 + n.x2) / 2;
        const my = (n.y1 + n.y2) / 2 - Math.hypot(n.x2 - n.x1, n.y2 - n.y1) * 0.25;
        ctx.moveTo(n.x1, n.y1);
        ctx.quadraticCurveTo(mx, my, n.x2, n.y2);
      } else {
        ctx.moveTo(n.x1, n.y1);
        ctx.lineTo(n.x2, n.y2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      arrowhead(ctx, n.x1, n.y1, n.x2, n.y2, n.size);
      if (n.type === "doubleArrow") arrowhead(ctx, n.x2, n.y2, n.x1, n.y1, n.size);
      break;
    }
    case "connector": {
      ctx.lineWidth = n.size;
      applyDash(ctx, n.dash, n.size);
      ctx.beginPath();
      if (n.variant === "elbow") {
        const midX = (n.x1 + n.x2) / 2;
        ctx.moveTo(n.x1, n.y1);
        ctx.lineTo(midX, n.y1);
        ctx.lineTo(midX, n.y2);
        ctx.lineTo(n.x2, n.y2);
      } else if (n.variant === "curved") {
        const cx = (n.x1 + n.x2) / 2;
        ctx.moveTo(n.x1, n.y1);
        ctx.bezierCurveTo(cx, n.y1, cx, n.y2, n.x2, n.y2);
      } else {
        ctx.moveTo(n.x1, n.y1);
        ctx.lineTo(n.x2, n.y2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (n.arrowEnd !== false) arrowhead(ctx, n.x1, n.y1, n.x2, n.y2, n.size);
      if (n.arrowStart) arrowhead(ctx, n.x2, n.y2, n.x1, n.y1, n.size);
      break;
    }
    case "text": {
      const weight = n.weight ?? 500;
      const italic = n.italic ? "italic " : "";
      ctx.font = `${italic}${weight} ${n.size}px ${n.fontFamily ?? "Inter, system-ui, sans-serif"}`;
      ctx.textBaseline = "top";
      ctx.textAlign = (n.align as CanvasTextAlign) ?? "left";
      const lines = n.text.split("\n");
      lines.forEach((line, i) => {
        const x = n.align === "center" ? n.x : n.align === "right" ? n.x : n.x;
        ctx.fillText(line, x, n.y + i * n.size * 1.25);
        if (n.underline) {
          const w = ctx.measureText(line).width;
          ctx.fillRect(x, n.y + (i + 1) * n.size * 1.15 - 1, w, Math.max(1, n.size * 0.06));
        }
      });
      break;
    }
    case "sticky": {
      ctx.fillStyle = n.color;
      const r = 6;
      const p = new Path2D();
      roundRectPath(p, n.x, n.y, n.w, n.h, r);
      ctx.fill(p);
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke(p);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `500 15px Inter, system-ui, sans-serif`;
      ctx.textBaseline = "top";
      wrapText(ctx, n.text, n.x + 12, n.y + 12, n.w - 24, 20);
      break;
    }
    case "image":
      drawImage(ctx, n, onImageLoad);
      break;
    case "frame": {
      ctx.save();
      // Faint fill
      ctx.fillStyle = "rgba(0,0,0,0.02)";
      ctx.fillRect(n.x, n.y, n.w, n.h);
      // Border
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(n.x, n.y, n.w, n.h);
      // Name label
      ctx.fillStyle = n.color;
      ctx.font = `600 12px Inter, system-ui, sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.fillText(n.name || "Frame", n.x, n.y - 4);
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, n: StrokeNode) {
  const preset = STROKE_PRESETS[n.tool] ?? STROKE_PRESETS.pen;
  ctx.globalAlpha = (n.opacity ?? preset.opacity) * (preset.opacity ?? 1);
  ctx.lineCap = preset.lineCap ?? "round";
  ctx.lineWidth = n.size * preset.sizeMul;

  const pts = n.points;
  if (pts.length < 2) {
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, (n.size * preset.sizeMul) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  // Chalk grain: overdraw dashed line at 20% opacity
  if (n.tool === "chalk") {
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.setLineDash([1.2, 2.5]);
    ctx.stroke();
    ctx.restore();
  }
}

function drawImage(
  ctx: CanvasRenderingContext2D,
  n: ImageNode,
  onImageLoad?: () => void,
) {
  const img = getCachedImage(n.src, onImageLoad);
  if (img) {
    ctx.save();
    const sx = n.flipX ? -1 : 1;
    const sy = n.flipY ? -1 : 1;
    ctx.translate(n.x + n.w / 2, n.y + n.h / 2);
    ctx.scale(sx, sy);
    ctx.drawImage(img, -n.w / 2, -n.h / 2, n.w, n.h);
    ctx.restore();
  } else {
    // Placeholder while loading
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(n.x, n.y, n.w, n.h);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(n.x, n.y, n.w, n.h);
    ctx.setLineDash([]);
  }
}

function arrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const head = 8 + size * 2;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - head * Math.cos(angle - Math.PI / 7), toY - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(toX - head * Math.cos(angle + Math.PI / 7), toY - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

function roundRectPath(
  p: Path2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const nx = w < 0 ? x + w : x;
  const ny = h < 0 ? y + h : y;
  const nw = Math.abs(w);
  const nh = Math.abs(h);
  const rr = Math.min(r, nw / 2, nh / 2);
  p.moveTo(nx + rr, ny);
  p.arcTo(nx + nw, ny, nx + nw, ny + nh, rr);
  p.arcTo(nx + nw, ny + nh, nx, ny + nh, rr);
  p.arcTo(nx, ny + nh, nx, ny, rr);
  p.arcTo(nx, ny, nx + nw, ny, rr);
  p.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const paragraphs = text.split("\n");
  let yy = y;
  for (const para of paragraphs) {
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        yy += lineHeight;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, yy);
      yy += lineHeight;
    }
  }
}

/** Export scene to an SVG string. */
export function sceneToSVG(nodes: SceneNode[], padding = 40): string {
  if (!nodes.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"></svg>`;
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of nodes) {
    const b = nodeBounds(n);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }
  const w = maxX - minX + padding * 2;
  const h = maxY - minY + padding * 2;
  const tx = -minX + padding;
  const ty = -minY + padding;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
  );
  parts.push(`<g transform="translate(${tx},${ty})">`);
  for (const n of nodes) parts.push(nodeToSVG(n));
  parts.push(`</g></svg>`);
  return parts.join("");
}

function dashAttr(n: { dash?: string; size?: number }) {
  const size = (n as any).size ?? 2;
  if (n.dash === "dashed") return `stroke-dasharray="${size * 3} ${size * 2}"`;
  if (n.dash === "dotted") return `stroke-dasharray="1 ${size * 2}"`;
  return "";
}

function nodeToSVG(n: SceneNode): string {
  const op = n.opacity ?? 1;
  switch (n.type) {
    case "stroke": {
      if (!n.points.length) return "";
      const d = n.points
        .map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`))
        .join(" ");
      const preset = STROKE_PRESETS[n.tool] ?? STROKE_PRESETS.pen;
      const sw = n.size * preset.sizeMul;
      const o = op * preset.opacity;
      return `<path d="${d}" fill="none" stroke="${n.color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
    }
    case "rect":
      return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${n.fill ?? "none"}" stroke="${n.color}" stroke-width="${n.size}" ${dashAttr(n)} opacity="${op}"/>`;
    case "roundedRect":
      return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.cornerRadius ?? 12}" fill="${n.fill ?? "none"}" stroke="${n.color}" stroke-width="${n.size}" ${dashAttr(n)} opacity="${op}"/>`;
    case "ellipse":
      return `<ellipse cx="${n.x + n.w / 2}" cy="${n.y + n.h / 2}" rx="${Math.abs(n.w / 2)}" ry="${Math.abs(n.h / 2)}" fill="${n.fill ?? "none"}" stroke="${n.color}" stroke-width="${n.size}" ${dashAttr(n)} opacity="${op}"/>`;
    case "triangle":
    case "diamond":
    case "pentagon":
    case "hexagon":
    case "star":
    case "heart":
    case "cloud":
      return `<path d="${shapePathD(n.type, n.x, n.y, n.w, n.h)}" fill="${n.fill ?? "none"}" stroke="${n.color}" stroke-width="${n.size}" ${dashAttr(n)} opacity="${op}"/>`;
    case "line":
      return `<line x1="${n.x1}" y1="${n.y1}" x2="${n.x2}" y2="${n.y2}" stroke="${n.color}" stroke-width="${n.size}" stroke-linecap="round" ${dashAttr(n)} opacity="${op}"/>`;
    case "arrow":
    case "doubleArrow":
    case "curvedArrow":
    case "connector": {
      const angle = Math.atan2(n.y2 - n.y1, n.x2 - n.x1);
      const head = 8 + n.size * 2;
      const hx1 = n.x2 - head * Math.cos(angle - Math.PI / 7);
      const hy1 = n.y2 - head * Math.sin(angle - Math.PI / 7);
      const hx2 = n.x2 - head * Math.cos(angle + Math.PI / 7);
      const hy2 = n.y2 - head * Math.sin(angle + Math.PI / 7);
      return `<g opacity="${op}"><line x1="${n.x1}" y1="${n.y1}" x2="${n.x2}" y2="${n.y2}" stroke="${n.color}" stroke-width="${n.size}" stroke-linecap="round" ${dashAttr(n)}/><polygon points="${n.x2},${n.y2} ${hx1},${hy1} ${hx2},${hy2}" fill="${n.color}"/></g>`;
    }
    case "text": {
      const lines = n.text.split("\n");
      return `<text x="${n.x}" y="${n.y + n.size}" font-family="Inter, sans-serif" font-size="${n.size}" font-weight="500" fill="${n.color}" opacity="${op}">${lines
        .map((l, i) => `<tspan x="${n.x}" dy="${i === 0 ? 0 : n.size * 1.25}">${escapeXML(l)}</tspan>`)
        .join("")}</text>`;
    }
    case "sticky":
      return `<g opacity="${op}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="${n.color}"/><foreignObject x="${n.x + 12}" y="${n.y + 12}" width="${n.w - 24}" height="${n.h - 24}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:500 15px Inter,sans-serif;color:#1a1a1a;white-space:pre-wrap;">${escapeXML(n.text)}</div></foreignObject></g>`;
    case "image":
      return `<image x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" href="${n.src}" opacity="${op}"/>`;
    case "frame":
      return `<g opacity="${op}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="none" stroke="${n.color}" stroke-width="1.5"/><text x="${n.x}" y="${n.y - 4}" font-family="Inter" font-size="12" font-weight="600" fill="${n.color}">${escapeXML(n.name || "Frame")}</text></g>`;
  }
}

function escapeXML(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!);
}
