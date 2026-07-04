const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Tools",
    items: [
      ["Select", "V"],
      ["Marquee", "M"],
      ["Hand / Pan", "H / Space"],
      ["Pen", "P"],
      ["Marker", "B"],
      ["Highlighter", "I"],
      ["Eraser", "E"],
      ["Rectangle", "R"],
      ["Ellipse", "O"],
      ["Line", "L"],
      ["Arrow", "A"],
      ["Text", "T"],
      ["Sticky note", "N"],
      ["Frame", "F"],
    ],
  },
  {
    title: "Edit",
    items: [
      ["Undo", "⌘Z"],
      ["Redo", "⌘⇧Z"],
      ["Copy", "⌘C"],
      ["Cut", "⌘X"],
      ["Paste", "⌘V"],
      ["Duplicate", "⌘D"],
      ["Select all", "⌘A"],
      ["Delete", "⌫ / Del"],
    ],
  },
  {
    title: "Arrange",
    items: [
      ["Bring forward", "⌘]"],
      ["Bring to front", "⌘⇧]"],
      ["Send backward", "⌘["],
      ["Send to back", "⌘⇧["],
      ["Lock / Unlock", "⌘L"],
    ],
  },
  {
    title: "View",
    items: [
      ["Zoom in / out", "Ctrl + wheel"],
      ["Pan", "Space + drag"],
      ["Fit / reset", "click zoom %"],
      ["Escape overlays", "Esc"],
    ],
  },
];

export function ShortcutsPanel() {
  return (
    <div className="space-y-4 text-sm">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {g.title}
          </div>
          <ul className="space-y-0.5">
            {g.items.map(([label, hint]) => (
              <li key={label} className="flex items-center justify-between py-0.5">
                <span className="text-foreground/80">{label}</span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {hint}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
