// Collaboration provider interface — scaffolding for future live sync.
// A real transport (WebSocket, WebRTC, CRDT) would implement this.
import type { SceneNode } from "./scene";

export interface RemoteCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  x: number;
  y: number;
  text: string;
  createdAt: number;
  resolved?: boolean;
}
export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  ts: number;
}

export interface CollaborationProvider {
  connect(boardId: string, user: { id: string; name: string; color: string }): Promise<void>;
  disconnect(): void;
  broadcastNodes(nodes: SceneNode[]): void;
  broadcastCursor(x: number, y: number): void;
  onCursors(cb: (cursors: RemoteCursor[]) => void): () => void;
  onNodes(cb: (nodes: SceneNode[]) => void): () => void;
  addComment(c: Comment): void;
  sendChat(m: ChatMessage): void;
}

/** No-op provider used by default. Replace at runtime with a real transport. */
export const noopProvider: CollaborationProvider = {
  async connect() {},
  disconnect() {},
  broadcastNodes() {},
  broadcastCursor() {},
  onCursors() {
    return () => {};
  },
  onNodes() {
    return () => {};
  },
  addComment() {},
  sendChat() {},
};
