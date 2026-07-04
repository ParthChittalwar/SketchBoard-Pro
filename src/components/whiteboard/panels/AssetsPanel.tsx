import { useRef } from "react";
import { Upload, Sticker } from "lucide-react";
import type { useWhiteboard as UseWhiteboard } from "@/hooks/use-whiteboard";
import { uid, type SceneNode } from "@/lib/whiteboard/scene";

const EMOJIS = ["✨","💡","✅","❌","⭐","🔥","❤️","👍","👎","❓","❗","📌","📎","🎯","📝","🧠","⚙️","🔒","🌱","🚀","🎨","📚","🧮","🧪","🧭","🕒","☀️","🌙"];
const SHAPES = ["○","△","□","◇","☆","➜","⇨","↺","∞","∑","π","√","∫","≈","≠","≤","≥"];

export function AssetsPanel({ wb }: { wb: ReturnType<typeof UseWhiteboard> }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const insertText = (text: string) => {
    const { camera } = wb.state;
    const x = -camera.x / camera.zoom + 200;
    const y = -camera.y / camera.zoom + 200;
    const node: SceneNode = {
      id: uid(),
      type: "text",
      color: wb.state.color,
      x,
      y,
      text,
      size: 44,
      layerId: wb.state.activeLayerId,
    };
    wb.commit([...wb.state.nodes, node]);
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const { camera } = wb.state;
        const w = Math.min(480, img.width);
        const scale = w / img.width;
        const h = img.height * scale;
        const x = -camera.x / camera.zoom + 120;
        const y = -camera.y / camera.zoom + 120;
        const node: SceneNode = {
          id: uid(),
          type: "image",
          color: "#000",
          x,
          y,
          w,
          h,
          src,
          layerId: wb.state.activeLayerId,
        };
        wb.commit([...wb.state.nodes, node]);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 text-sm">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-2 py-2 text-xs font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      >
        <Upload size={13} /> Upload image / SVG
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) insertImage(f);
          e.target.value = "";
        }}
      />

      <div>
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Sticker size={11} /> Emoji
        </div>
        <div className="grid grid-cols-7 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => insertText(e)}
              className="flex h-8 items-center justify-center rounded-md text-lg hover:bg-accent"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Symbols
        </div>
        <div className="grid grid-cols-7 gap-1">
          {SHAPES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => insertText(s)}
              className="flex h-8 items-center justify-center rounded-md font-serif text-base hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
