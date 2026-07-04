/** Dims the whole viewport except a circle around the cursor. */
export function SpotlightOverlay({ center }: { center: { x: number; y: number } | null }) {
  if (!center) return null;
  const r = 140;
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <mask id="spot-mask">
          <rect width="100%" height="100%" fill="white" />
          <circle cx={center.x} cy={center.y} r={r} fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#spot-mask)" />
      <circle
        cx={center.x}
        cy={center.y}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={1.5}
      />
    </svg>
  );
}
