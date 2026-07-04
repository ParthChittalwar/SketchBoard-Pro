
# Whiteboard Pro Expansion Plan

The current app has a solid foundation (canvas renderer, scene graph, tools, undo/redo, localStorage). Rather than shipping 200+ half-working buttons in one pass, I'll expand it in focused, modular phases that each leave the app fully working and preserve the existing UI, spacing, animations, and shortcuts.

## Phase 1 — Foundation (this turn)

Architecture upgrades so every later phase drops in cleanly.

**Scene / model**
- Extend `SceneNode` with: `opacity`, `dash` (solid/dashed/dotted), `cornerRadius`, `rotation`, `locked`, `layerId`, `zIndex`, `shadow`, additional shape kinds (`triangle`, `diamond`, `pentagon`, `hexagon`, `star`, `heart`, `cloud`, `rounded-rect`, `polyline`, `polygon`, `bezier`, `arc`), `image`, `frame`, `connector` (straight/elbow/curved/arrow endpoints).
- New tool ids for every category below; `ToolId` becomes a union covering pencil / smoothPen / marker / brush / highlighter / chalk / calligraphy / fountain; lasso / rectSelect; eraserStroke / eraserObject / eraserPartial; all shapes; connectors; laser; spotlight; frame; image; table.
- Utility modules: `src/lib/whiteboard/shapes.ts` (path builders per shape), `connectors.ts` (routing), `smoothing.ts` (Catmull-Rom + pressure-ready), `layers.ts`, `clipboard.ts`, `align.ts`, `arrange.ts`.

**State**
- Split `use-whiteboard.ts` into a `WhiteboardContext` provider + focused hooks: `useTool`, `useSelection`, `useCamera`, `useLayers`, `useHistory`, `useClipboard`. Same public surface for existing components.
- Add IndexedDB persistence layer (with localStorage fallback) behind `usePersistence`.

**Rendering**
- Extend `render.ts` to draw new shapes, rotation, dash, shadow, opacity, images, frames, connectors, and layer ordering. Keep the single-canvas 60fps path; add a lightweight second canvas only for laser/spotlight overlays.

## Phase 2 — Toolbar & Tools UI

- `components/whiteboard/tools/` folder with one small component per tool (Pointer, Lasso, Pencil, Marker, Brush, Highlighter, Chalk, Calligraphy, Fountain, EraserStroke, EraserObject, Shape*, Connector*, Text, Sticky, Frame, Image, Laser, Spotlight, Table).
- Toolbar becomes grouped + collapsible with popover flyouts for each category (Draw, Shape, Connector, Text, Media, Teach). Same visual language as today's toolbar.
- Bottom `StylePanel` expands with: opacity slider, dash style, corner radius, shadow toggle, font controls (family/size/bold/italic/underline/strike/align), rotation input — all shown contextually based on selection/tool.

## Phase 3 — Side Panels (lazy-loaded)

- `PropertiesPanel`, `LayersPanel`, `HistoryPanel`, `AssetsPanel` (emoji + SVG icons + upload), `TemplatesPanel`, `ShortcutsPanel`, `SettingsPanel`.
- Right-edge collapsible rail; each panel is `React.lazy` so initial bundle stays small.

## Phase 4 — Interaction upgrades

- Marquee + lasso selection, multi-select transforms (move/rotate/scale handles).
- Context menu (right-click) with Duplicate, Delete, Copy, Paste, Bring Forward/Back, Lock, Group, Properties.
- Full keyboard shortcut map (Figma-style) registered via a single `useShortcuts` hook.
- Alignment/distribute, arrange z-order, flip, snap-to-grid, smart guides.
- Clipboard (copy/paste/cut, copy style/paste style) — internal + system clipboard.

## Phase 5 — Media, Math & Teacher tools

- Image tool (upload / paste / drag-drop, resize, crop, rotate, mirror, opacity).
- Frame + section frame, presentation mode navigating between frames, fullscreen, freeze, hide toolbar, black/white screen.
- Laser pointer, spotlight, timer/stopwatch/countdown widget.
- Math overlays: ruler, protractor, compass, coordinate plane, number line, graph grid (rendered as scene overlays).

## Phase 6 — Export/Import & File

- Extend export to PNG/JPG/SVG/PDF/JSON + Print + Copy Image.
- Import PNG/SVG/PDF (as image)/JSON.
- File menu: New / Open / Rename / Duplicate / Delete / Favorite / Recent Boards, backed by IndexedDB.

## Phase 7 — Collaboration-ready scaffolding

Frontend-only stubs (no backend): `CursorsLayer`, `CommentsLayer`, `ChatPanel`, `InviteDialog`, read-only + presenter mode toggles, all wired to a `CollaborationProvider` interface with a no-op local adapter so a real transport can drop in later.

## Technical notes

- All existing files, tools, shortcuts, colors, animations, and layouts stay. Additions only.
- New tools live in `src/components/whiteboard/tools/*` and register themselves through a `toolRegistry` so the Toolbar renders from data — adding a tool = adding a file.
- Panels are `React.lazy` + Suspense so initial paint is unaffected.
- Renderer keeps world-space coords and a single main canvas; overlays (laser/spotlight/selection) use a second stacked canvas.
- History and persistence get a schema `version` field so future migrations are safe.

## Scope check

This is ~30-40 files of new code even for Phase 1 alone. Full delivery of every listed feature at production quality is multiple sessions of work. I'll ship phases in order, each self-contained and shippable. **Do you want me to start with Phase 1 now, or reorder priorities (e.g. jump to Teacher tools or Export first)?**
