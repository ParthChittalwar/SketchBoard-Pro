import { useEffect, useState } from "react";
import { Timer, Play, Pause, RotateCcw, X } from "lucide-react";

type Mode = "stopwatch" | "countdown";

export function TimerWidget({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const [target, setTarget] = useState(60_000);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setMs((m) => (mode === "stopwatch" ? m + 100 : Math.max(0, m - 100)));
    }, 100);
    return () => clearInterval(id);
  }, [running, mode]);

  useEffect(() => {
    if (mode === "countdown" && ms === 0 && running) setRunning(false);
  }, [ms, running, mode]);

  const start = () => {
    if (mode === "countdown" && ms === 0) setMs(target);
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setMs(mode === "countdown" ? target : 0);
  };
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const dec = Math.floor((ms % 1000) / 100);

  return (
    <div
      className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur"
      style={{ boxShadow: "var(--shadow-panel)", minWidth: 220 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Timer size={13} />
          {mode === "stopwatch" ? "Stopwatch" : "Countdown"}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close timer"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex items-center gap-1 text-[11px]">
        {(["stopwatch", "countdown"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              "rounded-md px-2 py-1 " +
              (mode === m
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent hover:text-foreground")
            }
          >
            {m === "stopwatch" ? "Stopwatch" : "Countdown"}
          </button>
        ))}
      </div>

      <div className="text-center font-mono text-3xl tabular-nums tracking-tight">
        {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
        <span className="text-xl text-muted-foreground">.{dec}</span>
      </div>

      {mode === "countdown" && !running && (
        <div className="flex items-center gap-1 text-xs">
          <label className="flex items-center gap-1 text-muted-foreground">
            Min
            <input
              type="number"
              min={0}
              value={Math.floor(target / 60000)}
              onChange={(e) => {
                const v = Math.max(0, parseInt(e.target.value) || 0);
                const s = target % 60000;
                setTarget(v * 60000 + s);
                setMs(v * 60000 + s);
              }}
              className="w-12 rounded border border-border bg-background px-1 py-0.5"
            />
          </label>
          <label className="flex items-center gap-1 text-muted-foreground">
            Sec
            <input
              type="number"
              min={0}
              max={59}
              value={Math.floor((target % 60000) / 1000)}
              onChange={(e) => {
                const v = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                const m = Math.floor(target / 60000);
                setTarget(m * 60000 + v * 1000);
                setMs(m * 60000 + v * 1000);
              }}
              className="w-12 rounded border border-border bg-background px-1 py-0.5"
            />
          </label>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => (running ? setRunning(false) : start())}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-foreground py-1.5 text-xs font-medium text-background hover:opacity-90"
        >
          {running ? <Pause size={13} /> : <Play size={13} />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center rounded-md border border-border px-2 py-1.5 text-xs text-foreground/70 hover:bg-accent hover:text-foreground"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}
