import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";
import { uid, type SceneNode } from "@/lib/whiteboard/scene";

type Template = { id: string; name: string; description: string; build: (layerId: string) => SceneNode[] };

const TEMPLATES: Template[] = [
  {
    id: "kanban",
    name: "Kanban board",
    description: "To do • Doing • Done",
    build: (layerId) => {
      const cols = ["To do", "Doing", "Done"];
      const nodes: SceneNode[] = [];
      cols.forEach((c, i) => {
        const x = 40 + i * 280;
        nodes.push({ id: uid(), type: "frame", color: "#94a3b8", x, y: 40, w: 240, h: 480, name: c, layerId });
        nodes.push({ id: uid(), type: "text", color: "#0f172a", x: x + 12, y: 76, text: c, size: 20, weight: 600, layerId });
      });
      return nodes;
    },
  },
  {
    id: "mindmap",
    name: "Mind map",
    description: "Central topic + branches",
    build: (layerId) => {
      const cx = 400, cy = 300;
      const nodes: SceneNode[] = [];
      nodes.push({ id: uid(), type: "ellipse", color: "#3b82f6", fill: "#dbeafe", x: cx - 90, y: cy - 40, w: 180, h: 80, size: 3, layerId });
      nodes.push({ id: uid(), type: "text", color: "#0f172a", x: cx - 50, y: cy + 6, text: "Main idea", size: 18, weight: 600, layerId });
      const branches = ["Idea 1", "Idea 2", "Idea 3", "Idea 4"];
      branches.forEach((b, i) => {
        const angle = (i / branches.length) * Math.PI * 2;
        const bx = cx + Math.cos(angle) * 260;
        const by = cy + Math.sin(angle) * 180;
        nodes.push({ id: uid(), type: "connector", variant: "curved", color: "#94a3b8", x1: cx, y1: cy, x2: bx, y2: by, size: 2, arrowEnd: true, layerId });
        nodes.push({ id: uid(), type: "roundedRect", color: "#64748b", fill: "#f1f5f9", x: bx - 60, y: by - 22, w: 120, h: 44, size: 2, cornerRadius: 10, layerId });
        nodes.push({ id: uid(), type: "text", color: "#0f172a", x: bx - 30, y: by + 6, text: b, size: 14, layerId });
      });
      return nodes;
    },
  },
  {
    id: "flowchart",
    name: "Flowchart",
    description: "Start → Process → End",
    build: (layerId) => {
      const nodes: SceneNode[] = [];
      const steps = [
        { shape: "ellipse", label: "Start" },
        { shape: "rect", label: "Process" },
        { shape: "diamond", label: "Decision?" },
        { shape: "ellipse", label: "End" },
      ] as const;
      let y = 60;
      steps.forEach((s, i) => {
        const x = 200;
        nodes.push({
          id: uid(),
          type: s.shape,
          color: "#0f172a",
          fill: "#f8fafc",
          x, y, w: 200, h: 70, size: 2, layerId,
        });
        nodes.push({ id: uid(), type: "text", color: "#0f172a", x: x + 60, y: y + 42, text: s.label, size: 16, layerId });
        if (i < steps.length - 1) {
          nodes.push({ id: uid(), type: "connector", variant: "straight", color: "#64748b", x1: x + 100, y1: y + 70, x2: x + 100, y2: y + 120, size: 2, arrowEnd: true, layerId });
        }
        y += 120;
      });
      return nodes;
    },
  },
  {
    id: "swot",
    name: "SWOT analysis",
    description: "Strengths / Weaknesses / Opportunities / Threats",
    build: (layerId) => {
      const nodes: SceneNode[] = [];
      const cells = [
        { l: "Strengths", c: "#dcfce7" },
        { l: "Weaknesses", c: "#fee2e2" },
        { l: "Opportunities", c: "#dbeafe" },
        { l: "Threats", c: "#fef3c7" },
      ];
      cells.forEach((cell, i) => {
        const x = 60 + (i % 2) * 260;
        const y = 60 + Math.floor(i / 2) * 220;
        nodes.push({ id: uid(), type: "roundedRect", color: "#334155", fill: cell.c, x, y, w: 240, h: 200, size: 2, cornerRadius: 12, layerId });
        nodes.push({ id: uid(), type: "text", color: "#0f172a", x: x + 12, y: y + 30, text: cell.l, size: 18, weight: 600, layerId });
      });
      return nodes;
    },
  },
  {
    id: "lesson",
    name: "Lesson plan",
    description: "Objective • Activities • Assessment",
    build: (layerId) => {
      const nodes: SceneNode[] = [];
      const sections = ["Objective", "Warm-up", "Main activity", "Assessment", "Homework"];
      sections.forEach((s, i) => {
        const y = 40 + i * 90;
        nodes.push({ id: uid(), type: "roundedRect", color: "#0f172a", fill: null, x: 40, y, w: 480, h: 70, size: 2, cornerRadius: 10, layerId });
        nodes.push({ id: uid(), type: "text", color: "#0f172a", x: 56, y: y + 42, text: s, size: 16, weight: 600, layerId });
      });
      return nodes;
    },
  },
];

export function TemplatesPanel({ wb }: { wb: ReturnType<typeof UseWhiteboard> }) {
  const insert = (t: Template) => {
    const built = t.build(wb.state.activeLayerId);
    wb.commit([...wb.state.nodes, ...built]);
  };
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-muted-foreground">Insert a starter layout onto the current layer.</p>
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => insert(t)}
          className="w-full rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-accent"
        >
          <div className="text-sm font-medium">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.description}</div>
        </button>
      ))}
    </div>
  );
}
