import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";

export function SettingsPanel({ wb }: { wb: ReturnType<typeof UseWhiteboard> }) {
  const { state } = wb;
  return (
    <div className="space-y-4 text-sm">
      <Row label="Theme">
        <Segmented
          value={state.theme}
          options={[
            { v: "light", l: "Light" },
            { v: "dark", l: "Dark" },
            { v: "chalk", l: "Chalk" },
          ]}
          onChange={(v) => wb.setTheme(v as any)}
        />
      </Row>
      <Row label="Grid">
        <Segmented
          value={state.grid}
          options={[
            { v: "none", l: "None" },
            { v: "dots", l: "Dots" },
            { v: "lines", l: "Lines" },
          ]}
          onChange={(v) => wb.setGrid(v as any)}
        />
      </Row>
      <Toggle label="Snap to grid" value={state.snapToGrid} onChange={wb.setSnapToGrid} />
      <Toggle label="Hide toolbar" value={state.hideToolbar} onChange={wb.setHideToolbar} />
      <Toggle label="Freeze canvas" value={state.frozen} onChange={wb.setFrozen} />
      <Row label="Screen">
        <Segmented
          value={state.screenOverlay}
          options={[
            { v: "none", l: "Off" },
            { v: "black", l: "Black" },
            { v: "white", l: "White" },
          ]}
          onChange={(v) => wb.setScreenOverlay(v as any)}
        />
      </Row>
      <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
        Preferences are saved automatically to your browser. Boards persist in IndexedDB and can be exported as JSON.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded px-2 py-1 text-xs ${
            value === o.v ? "bg-foreground text-background" : "text-foreground/70 hover:bg-accent"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span className="text-foreground/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          value ? "bg-foreground" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
