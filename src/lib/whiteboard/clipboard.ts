// Internal clipboard for nodes; separate from the OS clipboard so it survives
// focus loss and is type-safe.
import type { SceneNode } from "./scene";
import { translateNode, uid } from "./scene";

let clipboard: SceneNode[] = [];
let styleClipboard: Partial<SceneNode> | null = null;

export function setClipboard(nodes: SceneNode[]) {
  clipboard = nodes.map((n) => structuredClone(n));
}
export function getClipboard(): SceneNode[] {
  return clipboard.map((n) => ({ ...structuredClone(n), id: uid() }));
}
export function hasClipboard() {
  return clipboard.length > 0;
}

export function duplicateNodes(nodes: SceneNode[], offset = 24): SceneNode[] {
  return nodes.map((n) => translateNode({ ...structuredClone(n), id: uid() }, offset, offset));
}

export function setStyleClipboard(n: SceneNode) {
  const { color, opacity, dash } = n as any;
  const extra: any = {};
  if ("size" in (n as any)) extra.size = (n as any).size;
  if ("fill" in (n as any)) extra.fill = (n as any).fill;
  if ("cornerRadius" in (n as any)) extra.cornerRadius = (n as any).cornerRadius;
  styleClipboard = { color, opacity, dash, ...extra };
}
export function applyStyleClipboard(n: SceneNode): SceneNode {
  if (!styleClipboard) return n;
  return { ...n, ...styleClipboard } as SceneNode;
}
export function hasStyleClipboard() {
  return !!styleClipboard;
}
