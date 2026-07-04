// IndexedDB-backed board storage. Falls back to localStorage.
import type { SceneNode } from "./scene";

export interface BoardMeta {
  id: string;
  name: string;
  updatedAt: number;
  favorite?: boolean;
}
export interface BoardRecord extends BoardMeta {
  nodes: SceneNode[];
}

const DB_NAME = "wbpro";
const STORE = "boards";
const VERSION = 1;

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

const LS_KEY = "wbpro:boards";
function lsAll(): BoardRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function lsWrite(arr: BoardRecord[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch {
    /* quota */
  }
}

export async function listBoards(): Promise<BoardMeta[]> {
  const db = await openDB();
  if (!db) return lsAll().map(({ nodes, ...m }) => m);
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    tx.onsuccess = () => {
      const items = (tx.result as BoardRecord[]).map(({ nodes, ...m }) => m);
      items.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(items);
    };
    tx.onerror = () => resolve([]);
  });
}

export async function getBoard(id: string): Promise<BoardRecord | null> {
  const db = await openDB();
  if (!db) return lsAll().find((b) => b.id === id) ?? null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    tx.onsuccess = () => resolve((tx.result as BoardRecord) ?? null);
    tx.onerror = () => resolve(null);
  });
}

export async function saveBoard(rec: BoardRecord): Promise<void> {
  const db = await openDB();
  if (!db) {
    const arr = lsAll().filter((b) => b.id !== rec.id);
    arr.push(rec);
    lsWrite(arr);
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite").objectStore(STORE).put(rec);
    tx.onsuccess = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function deleteBoard(id: string): Promise<void> {
  const db = await openDB();
  if (!db) {
    lsWrite(lsAll().filter((b) => b.id !== id));
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    tx.onsuccess = () => resolve();
    tx.onerror = () => resolve();
  });
}
