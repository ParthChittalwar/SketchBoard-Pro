import { useEffect, useRef, useState } from "react";
import type { ToolId } from "@/lib/whiteboard/scene";
import { TOOLS, TOOLS_BY_GROUP, GROUP_ORDER, GROUP_LABEL, TOOL_BY_ID } from "@/lib/whiteboard/tools";
import type { ToolGroup } from "@/lib/whiteboard/tools";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Props {
  active: ToolId;
  onSelect: (t: ToolId) => void;
}

/**
 * Grouped, popover-driven toolbar. Preserves the existing look: rounded
 * card, same padding, same button visuals. Each group shows a primary
 * button + right-side chevron that reveals its tool list on hover / click.
 */
export function Toolbar({ active, onSelect }: Props) {
  const [openGroup, setOpenGroup] = useState<ToolGroup | null>(null);
  const activeGroup = TOOL_BY_ID[active]?.group ?? "select";

  // Remember last-picked tool per group so re-clicking the primary re-picks it
  const lastPickedRef = useRef<Record<ToolGroup, ToolId>>(
    GROUP_ORDER.reduce(
      (acc, g) => {
        acc[g] = TOOLS_BY_GROUP[g][0].id;
        return acc;
      },
      {} as Record<ToolGroup, ToolId>,
    ),
  );
  useEffect(() => {
    const def = TOOL_BY_ID[active];
    if (def) lastPickedRef.current[def.group] = def.id;
  }, [active]);

  return (
    <div
      className="pointer-events-auto flex max-h-[80vh] flex-col items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 backdrop-blur"
      style={{ boxShadow: "var(--shadow-toolbar)" }}
      role="toolbar"
      aria-label="Whiteboard tools"
      onMouseLeave={() => setOpenGroup(null)}
    >
      {GROUP_ORDER.map((g, gi) => {
        const tools = TOOLS_BY_GROUP[g];
        const primaryId = lastPickedRef.current[g];
        const primary = TOOL_BY_ID[primaryId] ?? tools[0];
        const isActive = activeGroup === g;
        const isOpen = openGroup === g;
        const hasMany = tools.length > 1;
        return (
          <div key={g} className="relative">
            {gi > 0 && gi % 3 === 0 && (
              <div className="mx-auto my-0.5 h-px w-6 bg-border" aria-hidden />
            )}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onSelect(primary.id)}
                onMouseEnter={() => hasMany && setOpenGroup(g)}
                title={`${primary.label}${primary.hint ? ` (${primary.hint})` : ""}`}
                aria-label={primary.label}
                aria-pressed={isActive}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 transition-colors",
                  "hover:bg-accent hover:text-foreground",
                  isActive &&
                    "bg-foreground text-background hover:bg-foreground hover:text-background",
                )}
              >
                <primary.icon size={17} strokeWidth={1.75} />
              </button>
              {hasMany && (
                <button
                  type="button"
                  aria-label={`${GROUP_LABEL[g]} options`}
                  onMouseEnter={() => setOpenGroup(g)}
                  onClick={() => setOpenGroup((v) => (v === g ? null : g))}
                  className="absolute -right-1 bottom-0.5 flex h-3 w-3 items-center justify-center rounded-sm text-foreground/40 hover:text-foreground"
                >
                  <ChevronRight size={9} strokeWidth={2.5} />
                </button>
              )}
            </div>
            {isOpen && hasMany && (
              <div
                className="absolute left-full top-0 z-40 ml-2 min-w-[168px] rounded-xl border border-border bg-popover p-1 text-popover-foreground"
                style={{ boxShadow: "var(--shadow-panel)" }}
              >
                <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {GROUP_LABEL[g]}
                </div>
                {tools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelect(t.id);
                      setOpenGroup(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-accent hover:text-foreground",
                      active === t.id && "bg-accent text-foreground",
                    )}
                  >
                    <t.icon size={15} strokeWidth={1.75} className="opacity-80" />
                    <span className="flex-1 text-left">{t.label}</span>
                    {t.hint && (
                      <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t.hint}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { TOOLS };
