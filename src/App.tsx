import { useState, useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import type { RiveMood } from "./types";
import { Clock, Maximize2, Bug, Gamepad2, Lightbulb, Minimize2, SkipForward, Pause, Play, StopCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Zustand stores ──────────────────────────────────────────────────────────
import { useSettingsStore } from "./stores/settingsStore";
import { useTaskStore } from "./stores/taskStore";
import { useNotesStore } from "./stores/notesStore";
import { useStats } from "./stores/statsStore";
import { useStatsStore } from "./stores/statsStore";
import { useGame } from "./stores/gameStore";
import { useGameStore } from "./stores/gameStore";
import { useAmbientStore, useAmbientEffect } from "./stores/ambientStore";
import { useRemindersStore, useRemindersEffect } from "./stores/remindersStore";

// ── Hooks that remain as hooks (side-effect / platform) ─────────────────────
import { useTimer } from "./hooks/useTimer";
import { useWindowSize } from "./hooks/useWindowSize";
import { useNotification } from "./hooks/useNotification";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSlabPixelTracker } from "./hooks/useSlabPixelTracker";
import { ModeToggle } from "./components/ModeToggle";
import { RiveCharacter } from "./components/RiveCharacter";
import { NotesPanel } from "./components/NotesPanel";
import { AmbientToggle } from "./components/AmbientToggle";
import { TaskDashboardOverlay } from "./components/TaskDashboardOverlay";
import { TimelineHistory } from "./components/TimelineHistory";
// BreakOverlay removed from compact — strip layout handles break state inline
import { RemindersPanel } from "./components/RemindersPanel";
import { ReminderAlert } from "./components/ReminderAlert";
import { DebugPanel } from "./components/DebugPanel";
import { YearProgress } from "./components/YearProgress";
import { WeatherWidget } from "./components/WeatherWidget";
import { MergedTimerCard } from "./components/MergedTimerCard";

// ── Components ──────────────────────────────────────────────────────────────
import { TitleBar } from "./components/TitleBar";

// TimerControls used only in expanded mode (MergedTimerCard handles it)
import { TaskList } from "./components/TaskList";
import { MergedMascotCard } from "./components/MergedMascotCard";
import { MergedStatsCard } from "./components/MergedStatsCard";
import { SettingsPanel } from "./components/SettingsPanel";
import GameApp from "./GameApp";

/**
 * Komponen utama aplikasi Pomodoro Timer.
 *
 * Shortcuts: Space = Play/Pause | R = Reset | L = Layout cycle
 */
function App() {
  // ── Zustand stores ──────────────────────────────────────────────────────
  const {
    layoutMode, setLayoutMode,
    showTracker, setShowTracker,
    focusDuration, setFocusDuration,
    breakDuration, setBreakDuration,
    longBreakDuration, setLongBreakDuration,
    autoStart, setAutoStart,
    ascii,
  } = useSettingsStore();

  const isExpanded = layoutMode === "expanded";

  const tasks = useTaskStore();
  const { note, setNote } = useNotesStore();
  const stats = useStats();
  const game = useGame();
  const { ambientType, cycleAmbient } = useAmbientStore();
  const reminders = useRemindersStore();

  // ── Side-effect hooks (stores + remaining hooks) ────────────────────────
  useAmbientEffect();
  useRemindersEffect();

  const { notifyTimerComplete, testAlarm } = useNotification();
  const { minimizeToTray, updateTrayTimer } = useWindowSize(layoutMode);
  const slabPixel = useSlabPixelTracker();

  // ── Local UI state ──────────────────────────────────────────────────────
  const [isTaskDashboardOpen, setIsTaskDashboardOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);

  // ── Callbacks (use getState() to avoid stale closures) ──────────────────
  const handleTimerComplete = useCallback((completedMode: "focus" | "break") => {
    notifyTimerComplete(completedMode);

    const { tasks: allTasks, activeTaskId, incrementActiveTaskPomodoro } = useTaskStore.getState();
    const { focusDuration: fd, breakDuration: bd, longBreakDuration: lbd } = useSettingsStore.getState();
    const { recordTimelineLog, recordSession } = useStatsStore.getState();
    const { recordGameSession } = useGameStore.getState();

    const currentActiveTask = allTasks.find(t => t.id === activeTaskId && !t.completed && !t.archived);
    const taskName = currentActiveTask ? currentActiveTask.text : undefined;

    recordTimelineLog(
      completedMode,
      completedMode === "focus" ? fd : (completedMode === "break" ? bd : lbd),
      completedMode === "focus" ? taskName : undefined
    );

    if (completedMode === "focus") {
      recordSession(fd);
      incrementActiveTaskPomodoro(fd);
      recordGameSession(fd);
    }
  }, [notifyTimerComplete]);

  const handleTimerReset = useCallback(() => { }, []);

  const handleToggleTask = useCallback((id: string) => {
    const { tasks: allTasks, toggleTask } = useTaskStore.getState();
    const { recordTaskComplete: statsRecord } = useStatsStore.getState();
    const { recordTaskComplete: gameRecord } = useGameStore.getState();

    const task = allTasks.find(t => t.id === id);
    if (task && !task.completed) {
      statsRecord();
      gameRecord();
    }
    toggleTask(id);
  }, []);

  const handleAddTask = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    useTaskStore.getState().submitNewTask();
  }, []);

  const openGameWindow = useCallback(() => {
    setIsGameOpen(true);
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────
  const timer = useTimer(focusDuration, breakDuration, longBreakDuration, autoStart, handleTimerComplete, handleTimerReset);

  // ── Tray updates ────────────────────────────────────────────────────────
  useEffect(() => {
    updateTrayTimer(timer.timeString, timer.mode, timer.isActive);
  }, [timer.timeString, timer.mode, timer.isActive, updateTrayTimer]);

  useEffect(() => {
    let unlistenToggle: (() => void) | undefined;
    let unlistenSkip: (() => void) | undefined;

    listen("tray-toggle", () => {
      timer.toggleTimer();
    }).then((fn) => { unlistenToggle = fn; }).catch(() => { });

    listen("tray-skip", () => {
      timer.switchMode(timer.mode === "focus" ? "break" : "focus");
    }).then((fn) => { unlistenSkip = fn; }).catch(() => { });

    return () => {
      unlistenToggle?.();
      unlistenSkip?.();
    };
  }, [timer.toggleTimer, timer.switchMode, timer.mode]);

  // ── Rive mood ───────────────────────────────────────────────────────────
  let currentMood: RiveMood = "idle";
  if (timer.mode === "break") {
    currentMood = "break";
  } else if (timer.msLeft === 0 && timer.mode === "focus") {
    // Focus timer just finished — show focusEnd for 3s before switching to break
    currentMood = "focus_end";
  } else if (!timer.isActive) {
    currentMood = "idle";
  } else {
    const halfMs = timer.totalModeMs / 2;
    const almostDoneMs = Math.min(timer.totalModeMs * 0.15, 60000);
    if (timer.msLeft <= almostDoneMs) currentMood = "almost_done";
    else if (timer.msLeft <= halfMs) currentMood = "halfway";
    else currentMood = "focus";
  }

  // ── Layout cycle ────────────────────────────────────────────────────────
  const cycleLayout = useCallback(() => {
    useSettingsStore.getState().setLayoutMode(
      layoutMode === "compact" ? "expanded" : layoutMode === "expanded" ? "mini" : "compact"
    );
  }, [layoutMode]);

  useKeyboardShortcuts({
    onToggleTimer: timer.toggleTimer,
    onResetTimer: timer.resetTimer,
    onCycleLayout: cycleLayout,
  });

  // ── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col w-full h-full bg-background text-foreground overflow-hidden relative rounded-xl border-border border", timer.mode)}>
      {layoutMode !== "mini" && (
        <TitleBar
          mode={timer.mode}
          layoutMode={layoutMode}
          isTrackerActive={!slabPixel.stopped && !slabPixel.paused && !!slabPixel.trackerTime}
          onSetLayout={setLayoutMode}
        />
      )}

      <div className={cn("flex flex-1 relative w-full overflow-hidden", isExpanded ? "flex-col h-full" : layoutMode === "compact" ? "" : "h-full")} data-tauri-drag-region>
        {layoutMode === "mini" ? (
          /* ── MINI MODE — 280×80px ultra-compact widget ── */
          <div
            className="mini-mode-card group"
            data-tauri-drag-region
            style={{
              width: "100%",
              height: "100%",
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e7e5e4",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: "12px",
              position: "relative",
            }}
          >
            {/* MODE BADGE — top-left absolute pill */}
            <span
              style={{
                position: "absolute",
                top: "7px",
                left: "8px",
                fontSize: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "2px 6px",
                borderRadius: "9999px",
                background: timer.mode === "focus" ? "#f97316" : "#22c55e",
                color: "white",
                lineHeight: 1,
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              {timer.mode === "focus" ? "FOCUS" : "BREAK"}
            </span>

            {/* EXPAND BUTTON — top-right absolute */}
            <button
              onClick={cycleLayout}
              title="Expand Mode"
              style={{
                position: "absolute",
                top: "7px",
                right: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#d6d3d1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#78716c")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d6d3d1")}
            >
              <Maximize2 size={10} />
            </button>

            {/* LEFT: cat mascot */}
            <div
              style={{
                width: "40px",
                height: "40px",
                flexShrink: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              data-tauri-drag-region
            >
              <RiveCharacter
                isActive={timer.isActive}
                isExpanded={false}
                mode={timer.mode}
                mood={currentMood}
                layoutMode="mini"
                ascii={ascii}
              />
            </div>

            {/* CENTER: timer + tracker + task name */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "1px",
                minWidth: 0,
              }}
              data-tauri-drag-region
            >
              {/* Pomodoro timer — Bebas Neue 38px */}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "38px",
                  lineHeight: 1,
                  color: "#1c1917",
                  letterSpacing: "0.04em",
                  opacity: !timer.isActive ? 0.5 : 1,
                  transition: "opacity 0.3s",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                {timer.timeString}
              </div>

              {/* Time tracker row */}
              {showTracker && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={10} color="#fb923c" />
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "monospace",
                      color: "#f97316",
                      lineHeight: 1,
                    }}
                  >
                    {slabPixel.isLoading && !slabPixel.trackerTime
                      ? "loading..."
                      : slabPixel.trackerTime || "—"}
                    {slabPixel.paused && !slabPixel.stopped && slabPixel.trackerTime ? " [P]" : ""}
                  </span>
                </div>
              )}

              {/* Active task name */}
              {(() => {
                const activeTask = tasks.tasks.find(
                  t => t.id === tasks.activeTaskId && !t.completed && !t.archived
                );
                return activeTask ? (
                  <span
                    title={activeTask.text}
                    style={{
                      fontSize: "10px",
                      color: "#a8a29e",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "120px",
                      lineHeight: 1,
                    }}
                  >
                    {activeTask.text}
                  </span>
                ) : null;
              })()}
            </div>

            {/* RIGHT: play/pause + stop buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              {/* Play / Pause */}
              <button
                onClick={timer.toggleTimer}
                title={timer.isActive ? "Pause" : "Resume"}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#f97316",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s, transform 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#ea7211")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f97316")}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.93)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                {timer.isActive
                  ? <Pause size={14} color="white" fill="white" />
                  : <Play size={14} color="white" fill="white" style={{ marginLeft: "1px" }} />}
              </button>

              {/* Stop / Reset */}
              <button
                onClick={timer.resetTimer}
                title="Stop & Reset"
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#f5f5f4",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s, color 0.15s",
                  color: "#a8a29e",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#f5f5f4";
                  e.currentTarget.style.color = "#a8a29e";
                }}
              >
                <StopCircle size={12} />
              </button>
            </div>

            {/* HOVER OVERLAY — skip row at bottom, click to skip session */}
            <button
              className="mini-skip-overlay"
              onClick={() => timer.switchMode(timer.mode === "focus" ? "break" : "focus")}
              title="Skip session"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "24px",
                background: "linear-gradient(to top, #fafaf9, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                opacity: 0,
                transition: "opacity 0.2s",
                pointerEvents: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <SkipForward size={10} color="#a8a29e" />
              <span style={{ fontSize: "9px", color: "#a8a29e", letterSpacing: "0.08em" }}>SKIP</span>
            </button>
          </div>
        ) : isExpanded ? (
          <div className="flex flex-col w-full h-full relative overflow-hidden">
            <div className="dashboard-container w-full overflow-y-auto">
              {/* --- LEFT COLUMN --- */}
              <div className="flex flex-col gap-3 w-full pb-16">
                <MergedTimerCard
                  timeString={timer.timeString}
                  mode={timer.mode}
                  isActive={timer.isActive}
                  msLeft={timer.msLeft}
                  totalModeMs={timer.totalModeMs}
                  sessionInCycle={timer.sessionInCycle}
                  activeTaskText={tasks.tasks.find(t => t.id === tasks.activeTaskId && !t.completed && !t.archived)?.text}
                  slabPixel={slabPixel}
                  showTracker={showTracker}
                  onToggleTracker={() => setShowTracker((p: boolean) => !p)}
                  onToggle={timer.toggleTimer}
                  onReset={timer.resetTimer}
                  onComplete={timer.completeSession}
                />

                <TaskList
                  tasks={tasks.tasks}
                  newTaskText={tasks.newTaskText}
                  activeTaskId={tasks.activeTaskId}
                  onNewTaskTextChange={tasks.setNewTaskText}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={tasks.deleteTask}
                  onSetActiveTask={tasks.setActiveTaskId}
                  onOpenDashboard={() => setIsTaskDashboardOpen(true)}
                />
                
                <NotesPanel note={note} onNoteChange={setNote} />
                <RemindersPanel
                  reminders={reminders.reminders}
                  onAdd={reminders.addReminder}
                  onDelete={reminders.deleteReminder}
                  onClearTriggered={reminders.clearTriggered}
                />

                <SettingsPanel
                  focusDuration={focusDuration}
                  breakDuration={breakDuration}
                  longBreakDuration={longBreakDuration}
                  autoStart={autoStart}
                  onFocusDurationChange={setFocusDuration}
                  onBreakDurationChange={setBreakDuration}
                  onLongBreakDurationChange={setLongBreakDuration}
                  onAutoStartChange={setAutoStart}
                />

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={14} className="text-orange-400" />
                        <span className="card-title">FOCUS TIP</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                        Break large tasks into smaller sub-tasks to keep momentum and reduce mental fatigue.
                    </p>
                </div>
              </div>

              {/* --- RIGHT COLUMN --- */}
              <div className="flex flex-col gap-3 w-full pb-16">
                {timer.mode === "break" && (
                    <Card className="p-4 border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer transition-colors animate-in slide-in-from-top-4 fade-in duration-300" onClick={openGameWindow} title="Pecahkan skor Flappy Droid!">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                        <Gamepad2 size={14} className="text-orange-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">FLAPPY DROID</span>
                        </div>
                        <div className="flex items-center gap-2 bg-stone-100 px-2 py-0.5 rounded-full">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400">HI-SCORE</span>
                        <span className="text-[10px] font-bold text-stone-700">{game.flappyDroidScore}</span>
                        </div>
                    </div>
                    </Card>
                )}

                <MergedMascotCard
                  isActive={timer.isActive}
                  mode={timer.mode}
                  mood={currentMood}
                  xpPercent={game.xpPercent}
                  xp={game.xp}
                  xpToNextLevel={game.xpToNextLevel}
                  level={game.level}
                  totalXp={game.totalXp}
                  streak={game.streak}
                  totalSessions={game.totalSessions}
                  achievements={game.achievements}
                  ascii={ascii}
                />

                <MergedStatsCard
                  todaySessions={stats.todaySessions}
                  todayFocusMinutes={stats.todayFocusMinutes}
                  sessionInCycle={timer.sessionInCycle}
                  last7Days={stats.last7Days}
                  heatmap90={stats.heatmap90}
                  hourlyProductivity={stats.hourlyProductivity}
                />

                <TimelineHistory logs={stats.logs} />
                <YearProgress />
              </div>
            </div>

            {/* STICKY BOTTOM BAR — dark redesign */}
            <div className="absolute bottom-0 left-0 w-full h-11 bg-[#1a1a1a] border-t border-stone-700 flex items-center justify-between px-4 z-50">
                {/* LEFT: weather / tracker */}
                <div className="flex items-center relative h-full min-w-[150px]">
                    {(() => {
                        const isTracking = !slabPixel.stopped && !slabPixel.paused && !!slabPixel.trackerTime;
                        return (
                            <>
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 flex items-center gap-3 w-max ${isTracking ? "opacity-0 invisible" : "opacity-100"}`}>
                                    <WeatherWidget layoutMode={layoutMode} />
                                </div>
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 flex items-center gap-2 w-max ${isTracking ? "opacity-100" : "opacity-0 invisible"}`}>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                                    </span>
                                    <span className="text-[10px] font-mono text-stone-300 uppercase tracking-wider">
                                        TRK
                                    </span>
                                    <span className="text-[11px] font-mono font-semibold text-white tracking-widest mt-[1px]">
                                        {slabPixel.trackerTime || "00:00:00"}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* CENTER: mode toggle pill — absolute center */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <ModeToggle mode={timer.mode} onSwitchMode={timer.switchMode} />
                </div>

                {/* RIGHT: ambient + settings + minimize */}
                <div className="flex items-center gap-3">
                    <AmbientToggle ambientType={ambientType} onCycle={cycleAmbient} />
                    <div className="w-px h-3 bg-stone-700" />
                    <button
                        className="text-stone-400 hover:text-stone-200 transition-colors"
                        onClick={() => setIsDebugOpen(true)}
                        title="Settings / Debug"
                    >
                        <Bug size={14} />
                    </button>
                    <div className="w-px h-3 bg-stone-700" />
                    <button
                        className="text-stone-400 hover:text-stone-200 transition-colors"
                        onClick={minimizeToTray}
                        title="Minimize to tray"
                    >
                        <Minimize2 size={12} />
                    </button>
                </div>
            </div>
          </div>
        ) : (
          // ── Compact strip ──────────────────────────────────────────────────
          // Single 64px flat horizontal bar. No card shell. Navbar sits above.
          // Animates in/out with opacity + scale when switching modes.
          <div
            className="w-full h-16 bg-white border-t border-stone-100 flex items-center justify-between px-4 transition-all duration-150 ease-out"
            style={{ animation: "compact-enter 150ms ease-out" }}
            data-tauri-drag-region
          >
            {/* ── LEFT: badge + timer + play button ── */}
            <div className="flex items-center gap-3">
              {/* Mode badge */}
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
                {timer.mode}
              </span>

              {/* Timer — Bebas Neue 36px */}
              <span
                className={`leading-none select-none transition-opacity ${!timer.isActive ? "opacity-50" : ""}`}
                style={{ fontFamily: "var(--font-display)", fontSize: "36px", letterSpacing: "0.04em", color: "#1c1917" }}
              >
                {timer.timeString}
              </span>

              {/* Play / Pause — 32px orange circle */}
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors active:scale-95 shrink-0"
                onClick={timer.toggleTimer}
                title={timer.isActive ? "Pause" : "Resume"}
              >
                {timer.isActive
                  ? <Pause size={14} className="text-white" fill="currentColor" />
                  : <Play size={14} className="text-white ml-px" fill="currentColor" />}
              </button>
            </div>

            {/* ── CENTER: mini mascot + task name ── */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center px-3">
              {/* Mascot — tiny, 32px, clipped to show just the face */}
              <div className="shrink-0 overflow-hidden rounded-full" style={{ width: "32px", height: "32px" }}>
                <RiveCharacter
                  isActive={timer.isActive}
                  isExpanded={false}
                  mode={timer.mode}
                  mood={currentMood}
                  xpPercent={game.xpPercent}
                  ascii={ascii}
                />
              </div>
              {/* Task name */}
              {(() => {
                const activeTask = tasks.tasks.find(
                  t => t.id === tasks.activeTaskId && !t.completed && !t.archived
                );
                return activeTask ? (
                  <span className="text-xs text-stone-500 truncate max-w-[160px]" title={activeTask.text}>
                    {activeTask.text}
                  </span>
                ) : (
                  <span className="text-xs text-stone-300 italic">No task</span>
                );
              })()}
            </div>

            {/* ── RIGHT: skip + expand ── */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="text-stone-400 hover:text-stone-600 transition-colors p-1"
                onClick={() => timer.switchMode(timer.mode === "focus" ? "break" : "focus")}
                title="Skip session"
              >
                <SkipForward size={14} />
              </button>
              <button
                className="text-stone-400 hover:text-stone-600 transition-colors p-1"
                onClick={() => setLayoutMode("expanded")}
                title="Expand"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isTaskDashboardOpen && (
        <TaskDashboardOverlay
          tasks={tasks.tasks}
          onClose={() => setIsTaskDashboardOpen(false)}
          onAddTask={tasks.addDashboardTask}
          onToggleTask={handleToggleTask}
          onArchiveTask={tasks.archiveTask}
          onUnarchiveTask={tasks.unarchiveTask}
          onDeleteTask={tasks.deleteTask}
          onEditTask={tasks.editTask}
          onAddSubTask={tasks.addSubTask}
          onToggleSubTask={tasks.toggleSubTask}
          onDeleteSubTask={tasks.deleteSubTask}
          onEditSubTask={tasks.editSubTask}
          onAddTag={tasks.addTagToTask}
          onRemoveTag={tasks.removeTagFromTask}
        />
      )}

      <ReminderAlert
        alerts={reminders.alerts}
        onDismiss={reminders.dismissAlert}
      />

      {isDebugOpen && (
        <DebugPanel
          onClose={() => setIsDebugOpen(false)}
          triggerWelcomeNotification={reminders.triggerSessionWelcomeNotification}
          triggerMorningNotification={reminders.triggerMorningNotification}
          notifyTimerComplete={notifyTimerComplete}
          testAlarm={testAlarm}
          game={game}
          tasks={tasks}
        />
      )}

      {isGameOpen && (
        <GameApp onClose={() => setIsGameOpen(false)} />
      )}
    </div>
  );
}

export default App;
