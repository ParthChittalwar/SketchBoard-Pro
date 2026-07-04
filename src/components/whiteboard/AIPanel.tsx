import { X, Sparkles, Wand2, Network, ListChecks, Lightbulb, FunctionSquare } from "lucide-react";
import { useState } from "react";

const PROMPTS = [
  { icon: Network, label: "Flowchart", prompt: "Generate a flowchart for..." },
  { icon: Wand2, label: "Mind map", prompt: "Create a mind map about..." },
  { icon: ListChecks, label: "Lesson plan", prompt: "Draft a lesson plan on..." },
  { icon: FunctionSquare, label: "Solve math", prompt: "Solve step-by-step:" },
  { icon: Lightbulb, label: "Explain topic", prompt: "Explain simply:" },
  { icon: Sparkles, label: "Summarize board", prompt: "Summarize the current board" },
];

export function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  if (!open) return null;

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      {
        role: "assistant",
        text:
          "AI is not yet connected. Wire your OpenAI, Gemini or Claude API key in Settings — the panel and prompt library are ready to stream results here.",
      },
    ]);
    setInput("");
  };

  return (
    <aside
      className="pointer-events-auto absolute right-4 top-20 bottom-24 z-30 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur"
      style={{ boxShadow: "var(--shadow-panel)" }}
      aria-label="AI assistant"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} />
          <h2 className="text-sm font-semibold tracking-tight">AI Assistant</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close AI panel"
        >
          <X size={15} />
        </button>
      </header>

      <div className="border-b border-border p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Prompt library
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setInput(p.prompt + " ")}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left text-xs font-medium hover:bg-accent"
            >
              <p.icon size={13} className="text-muted-foreground" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {messages.length === 0 ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ask anything, or pick a prompt above.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto max-w-[90%] bg-foreground text-background"
                  : "mr-auto max-w-[95%] bg-muted text-foreground"
              }`}
            >
              {m.text}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask the whiteboard AI…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
          />
          <button
            type="button"
            onClick={send}
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Bring your own key — OpenAI, Gemini, Claude, or a local model.
        </p>
      </div>
    </aside>
  );
}
