import { useEffect, useRef, useState } from "react";
import { X, Ruler as RulerIcon, Compass } from "lucide-react";

type Mode = "ruler" | "protractor";

/** Draggable, rotatable math overlay. Purely visual — doesn't touch the scene. */
export function RulerOverlay({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("ruler");
  const [pos, setPos] = useState({ x: 200, y: 200 });
  const [rot, setRot] = useState(0);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({ x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy });
    };
    const onUp = () => (dragRef.current = null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div
      className="pointer-events-auto fixed z-30"
      style={{ left: pos.x, top: pos.y, transform: `rotate(${rot}deg)`, transformOrigin: "top left" }}
    >
      <div className="mb-1 flex items-center gap-1 rounded-lg border border-border bg-card/95 px-1.5 py-1 backdrop-blur" style={{ transform: `rotate(${-rot}deg)`, transformOrigin: "top left" }}>
        <button
          onClick={() => setMode("ruler")}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${mode === "ruler" ? "bg-foreground text-background" : "hover:bg-accent"}`}
        >
          <RulerIcon size={11} /> Ruler
        </button>
        <button
          onClick={() => setMode("protractor")}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${mode === "protractor" ? "bg-foreground text-background" : "hover:bg-accent"}`}
        >
          <Compass size={11} /> Protractor
        </button>
        <input
          type="range"
          min={-180}
          max={180}
          value={rot}
          onChange={(e) => setRot(Number(e.target.value))}
          className="mx-1 w-20 accent-foreground"
          title="Rotate"
        />
        <button onClick={onClose} className="rounded p-0.5 hover:bg-accent">
          <X size={11} />
        </button>
      </div>
      {mode === "ruler" ? <RulerSVG onDown={(e) => (dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y })} /> : <ProtractorSVG onDown={(e) => (dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y })} />}
    </div>
  );
}

function RulerSVG({ onDown }: { onDown: (e: React.MouseEvent) => void }) {
  const ticks = [];
  for (let i = 0; i <= 40; i++) {
    const x = 10 + i * 12;
    const long = i % 5 === 0;
    ticks.push(<line key={i} x1={x} y1={0} x2={x} y2={long ? 14 : 8} stroke="#334155" strokeWidth={long ? 1.2 : 0.8} />);
    if (long) ticks.push(<text key={`t${i}`} x={x} y={26} fontSize={9} textAnchor="middle" fill="#334155">{i}</text>);
  }
  return (
    <svg
      width={500}
      height={54}
      onMouseDown={onDown}
      className="cursor-move select-none"
      style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}
    >
      <rect x={0} y={0} width={500} height={40} rx={4} fill="rgba(255,251,220,0.9)" stroke="#c4a35a" />
      {ticks}
    </svg>
  );
}

function ProtractorSVG({ onDown }: { onDown: (e: React.MouseEvent) => void }) {
  const r = 140;
  const cx = r, cy = r;
  const marks = [];
  for (let deg = 0; deg <= 180; deg += 10) {
    const a = (deg * Math.PI) / 180;
    const x1 = cx - Math.cos(a) * r;
    const y1 = cy - Math.sin(a) * r;
    const x2 = cx - Math.cos(a) * (r - (deg % 30 === 0 ? 14 : 8));
    const y2 = cy - Math.sin(a) * (r - (deg % 30 === 0 ? 14 : 8));
    marks.push(<line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={0.8} />);
    if (deg % 30 === 0) {
      const tx = cx - Math.cos(a) * (r - 24);
      const ty = cy - Math.sin(a) * (r - 24);
      marks.push(<text key={`t${deg}`} x={tx} y={ty + 3} fontSize={10} textAnchor="middle" fill="#334155">{deg}</text>);
    }
  }
  return (
    <svg
      width={r * 2}
      height={r + 8}
      onMouseDown={onDown}
      className="cursor-move select-none"
      style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}
    >
      <path d={`M 0 ${r} A ${r} ${r} 0 0 1 ${r * 2} ${r} L 0 ${r} Z`} fill="rgba(255,251,220,0.9)" stroke="#c4a35a" />
      {marks}
    </svg>
  );
}
