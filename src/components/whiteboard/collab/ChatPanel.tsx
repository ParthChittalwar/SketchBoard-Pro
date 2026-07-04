import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

interface Message {
  id: string;
  author: string;
  text: string;
  ts: number;
  self?: boolean;
}

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "sys", author: "System", text: "Chat runs locally until a collaboration backend is connected.", ts: Date.now() - 5000 },
  ]);
  const [draft, setDraft] = useState("");
  if (!open) return null;

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setMessages((m) => [...m, { id: Math.random().toString(36).slice(2), author: "You", text: t, ts: Date.now(), self: true }]);
    setDraft("");
  };

  return (
    <div
      className="pointer-events-auto fixed bottom-24 right-4 z-40 flex h-[60vh] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur"
      style={{ boxShadow: "var(--shadow-panel)" }}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare size={15} /> Chat
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}>
            <div className="text-[10px] text-muted-foreground">{m.author}</div>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                m.self ? "bg-foreground text-background" : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={send}
          className="flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
