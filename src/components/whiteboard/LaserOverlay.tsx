/** Renders a fading laser trail as an SVG overlay on top of the canvas. */
export function LaserOverlay({
  points,
}: {
  points: { x: number; y: number; t: number }[];
}) {
  if (!points.length) return null;
  const now = performance.now();
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20"
      style={{ mixBlendMode: "screen" }}
      aria-hidden
    >
      {points.map((p, i) => {
        if (i === 0) return null;
        const prev = points[i - 1];
        const age = now - p.t;
        const opacity = Math.max(0, 1 - age / 900);
        return (
          <line
            key={i}
            x1={prev.x}
            y1={prev.y}
            x2={p.x}
            y2={p.y}
            stroke="#ef4444"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={opacity}
          />
        );
      })}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={8}
          fill="#ef4444"
          opacity={0.9}
        />
      )}
    </svg>
  );
}
