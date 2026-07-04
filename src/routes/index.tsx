import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WhiteboardCanvas } from "@/components/whiteboard/WhiteboardCanvas";
import { Toolbar } from "@/components/whiteboard/Toolbar";
import { StylePanel } from "@/components/whiteboard/StylePanel";
import { TopBar } from "@/components/whiteboard/TopBar";
import { ZoomControls } from "@/components/whiteboard/ZoomControls";
import { AIPanel } from "@/components/whiteboard/AIPanel";
import { AuthModal } from "@/components/whiteboard/AuthModal";
import { Footer } from "@/components/whiteboard/Footer";
import { SidePanelRail } from "@/components/whiteboard/SidePanelRail";
import { TimerWidget } from "@/components/whiteboard/TimerWidget";
import { BoardsDialog } from "@/components/whiteboard/BoardsDialog";
import { InviteDialog } from "@/components/whiteboard/collab/InviteDialog";
import { ChatPanel } from "@/components/whiteboard/collab/ChatPanel";
import { RulerOverlay } from "@/components/whiteboard/RulerOverlay";
import { useWhiteboard } from "@/hooks/use-whiteboard";

export const Route = createFileRoute("/")({
  component: WhiteboardApp,
});

function WhiteboardApp() {
  const wb = useWhiteboard();
  const [aiOpen, setAIOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rulerOpen, setRulerOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", wb.state.theme === "dark");
  }, [wb.state.theme]);

  const cycleTheme = () => {
    const order: Array<typeof wb.state.theme> = ["light", "dark", "chalk"];
    wb.setTheme(order[(order.indexOf(wb.state.theme) + 1) % order.length]);
  };
  const cycleGrid = () => {
    const order: Array<typeof wb.state.grid> = ["dots", "lines", "none"];
    wb.setGrid(order[(order.indexOf(wb.state.grid) + 1) % order.length]);
  };
  const togglePresentation = () => {
    const next = !wb.state.presentation;
    wb.setPresentation(next);
    if (next) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  const hideChrome = wb.state.presentation || wb.state.hideToolbar;

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden">
      <WhiteboardCanvas wb={wb} />

      {!hideChrome && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3 sm:p-4">
          <TopBar
            state={wb.state}
            onUndo={wb.undo}
            onRedo={wb.redo}
            onClear={wb.clear}
            onOpenAI={() => setAIOpen((v) => !v)}
            onOpenAuth={() => setAuthOpen(true)}
            onToggleTheme={cycleTheme}
            onCycleGrid={cycleGrid}
            onImportJSON={wb.importJSON}
            onToggleTimer={() => setTimerOpen((v) => !v)}
            onTogglePresentation={togglePresentation}
            onOpenBoards={() => setBoardsOpen(true)}
            onOpenInvite={() => setInviteOpen(true)}
            onToggleChat={() => setChatOpen((v) => !v)}
            onToggleRuler={() => setRulerOpen((v) => !v)}
          />
        </div>
      )}

      {!hideChrome && (
        <div className="pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-4">
          <Toolbar active={wb.state.tool} onSelect={wb.setTool} />
        </div>
      )}

      {!hideChrome && (
        <div className="pointer-events-none absolute right-3 top-1/2 z-20 -translate-y-1/2 sm:right-4">
          <SidePanelRail wb={wb} />
        </div>
      )}

      {!hideChrome && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-wrap items-end justify-center gap-3 px-3 sm:bottom-4">
          <StylePanel
            color={wb.state.color}
            size={wb.state.size}
            fill={wb.state.fill}
            opacity={wb.state.opacity}
            dash={wb.state.dash}
            onColor={wb.setColor}
            onSize={wb.setSize}
            onFill={wb.setFill}
            onOpacity={wb.setOpacity}
            onDash={wb.setDash}
          />
          <ZoomControls
            camera={wb.state.camera}
            onChange={wb.setCamera}
            onReset={() => wb.setCamera(() => ({ x: 0, y: 0, zoom: 1 }))}
          />
          <Footer />
        </div>
      )}

      {timerOpen && !hideChrome && (
        <div className="pointer-events-none absolute right-4 top-20 z-30">
          <TimerWidget onClose={() => setTimerOpen(false)} />
        </div>
      )}

      {wb.state.presentation && (
        <button
          type="button"
          onClick={() => wb.setPresentation(false)}
          className="pointer-events-auto absolute right-4 top-4 z-40 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-accent"
        >
          Exit presentation (Esc)
        </button>
      )}

      {rulerOpen && !hideChrome && <RulerOverlay onClose={() => setRulerOpen(false)} />}
      <ChatPanel open={chatOpen && !hideChrome} onClose={() => setChatOpen(false)} />

      <AIPanel open={aiOpen} onClose={() => setAIOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <BoardsDialog open={boardsOpen} onClose={() => setBoardsOpen(false)} wb={wb} />
      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </main>
  );
}
