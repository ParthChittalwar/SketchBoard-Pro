import { useState } from "react";
import { Users, Copy, Check, X } from "lucide-react";

export function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const link = typeof window !== "undefined" ? window.location.href : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* denied */ }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground"
        style={{ boxShadow: "var(--shadow-panel)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users size={16} /> Invite collaborators
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X size={16} />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Live collaboration is coming soon. Share this link with your team — once the sync backend is enabled, everyone with the link will draw together in real time.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs"
          />
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
          Presence, cursors, comments and chat are wired to a pluggable <code className="rounded bg-muted px-1">CollaborationProvider</code>. A no-op adapter runs by default; drop in a WebSocket, WebRTC or CRDT transport to go live.
        </div>
      </div>
    </div>
  );
}
