import { useState, useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import type { RiveMood } from "./types";
import { Clock, Maximize2, Bug, Gamepad2, Lightbulb, Minimize2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { BreakOverlay } from "./components/BreakOverlay";
import { RemindersPanel } from "./components/RemindersPanel";
import { ReminderAlert } from "./components/ReminderAlert";
import { DebugPanel } from "./components/DebugPanel";
import { YearProgress } from "./components/YearProgress";
import { WeatherWidget } from "./components/WeatherWidget";
import { MergedTimerCard } from "./components/MergedTimerCard";

// ── Components ──────────────────────────────────────────────────────────────
import { TitleBar } from "./components/TitleBar";

import { TimerControls } from "./components/TimerControls";
import { TaskList } from "./components/TaskList";
import { MergedMascotCard } from "./components/MergedMascotCard";
import { MergedStatsCard } from "./components/MergedStatsCard";
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
    focusDuration,
    breakDuration,
    longBreakDuration,
    autoStart,
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

      <div className={cn("flex flex-1 relative w-full h-full", isExpanded ? "flex-col overflow-hidden" : layoutMode === "compact" ? "flex-row items-stretch justify-between m-2 mb-3 rounded-[14px] overflow-hidden border border-border bg-card" : "")} data-tauri-drag-region>
        {layoutMode === "mini" ? (
          <div className="flex flex-row items-center justify-between w-full h-full px-3 gap-4 relative" data-tauri-drag-region>
            <div className="mini-tracker-indicator" title={`SlabPixel Tracker: ${!slabPixel.trackerTime ? "Not Connected" : (slabPixel.paused || slabPixel.stopped ? "Standby" : "Running")}`}>
              <div className={`mini-tracker-dot ${!slabPixel.trackerTime ? "disconnected" : (slabPixel.paused || slabPixel.stopped ? "standby" : "active")}`} />
            </div>
            <button className="mini-expand-btn" onClick={cycleLayout} title="Expand Mode">
              <Maximize2 size={12} />
            </button>
            <div className="mini-rive-wrapper" data-tauri-drag-region>
              <RiveCharacter
                isActive={timer.isActive}
                isExpanded={false}
                mode={timer.mode}
                mood={currentMood}
                layoutMode="mini"
                ascii={ascii}
              />
            </div>

            <div className="mini-timer-block" data-tauri-drag-region>
              <div className={`timer-display text-stone-800 mini${!timer.isActive ? " idle" : ""}`} data-tauri-drag-region>
                {timer.timeString}
              </div>

              {showTracker && (
                <div className="mini-tracker-display" title="SlabPixel Tracker Timer">
                  <Clock size={10} style={{ marginRight: 4 }} />
                  {slabPixel.isLoading && !slabPixel.trackerTime ? "loading..." : (slabPixel.trackerTime || "—")}
                  {slabPixel.paused && !slabPixel.stopped && slabPixel.trackerTime ? " [P]" : ""}
                </div>
              )}

              {timer.mode === "break" ? (() => {
                const progress = timer.totalModeMs > 0 ? (1 - timer.msLeft / timer.totalModeMs) * 100 : 0;
                return (
                  <div className="w-full mt-2">
                    <Progress value={progress} className="h-1" />
                  </div>
                );
              })() : (
                (() => {
                  const activeTask = tasks.tasks.find(t => t.id === tasks.activeTaskId && !t.completed && !t.archived);
                  return activeTask ? (
                    <div className={`mini-active-task ${timer.isActive ? "running" : ""}`}>
                      <div className="blink-dot" />
                      <span className="mini-active-task-text" title={activeTask.text}>
                        {activeTask.text}
                      </span>
                    </div>
                  ) : null;
                })()
              )}
            </div>
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
          <>
            {/* Kolom Kiri Compact */}
            <div className={cn("flex flex-col z-20 shrink-0", layoutMode === "compact" ? "gap-2" : "gap-1 items-center")}>
              <div className="flex flex-col items-center justify-center gap-3 p-4 min-w-[200px] flex-1 z-20">
                <Badge variant={timer.mode === "focus" ? "default" : "secondary"} className="uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full">
                  {timer.mode}
                </Badge>
                
                <div className={`font-display text-5xl text-stone-800 tracking-tight${!timer.isActive ? " opacity-80" : ""}`}>
                  {timer.timeString}
                </div>

                <TimerControls
                  isActive={timer.isActive}
                  layout={layoutMode}
                  onToggle={timer.toggleTimer}
                  onReset={timer.resetTimer}
                  onComplete={timer.completeSession}
                />

                {(() => {
                  const activeTask = tasks.tasks.find(t => t.id === tasks.activeTaskId && !t.completed && !t.archived);
                  return activeTask ? (
                    <div className="flex items-center gap-1.5 w-full pt-2 mt-1 border-t border-border/50 text-[10px] text-muted-foreground justify-center">
                      <div className={`w-1 h-1 rounded-full shrink-0 ${timer.isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'}`} />
                      <span className="truncate font-medium max-w-[140px]" title={activeTask.text}>{activeTask.text}</span>
                    </div>
                  ) : null;
                })()}
              </div>

              {timer.mode === "break" && (
                <BreakOverlay msLeft={timer.msLeft} totalMs={timer.totalModeMs} timeString={timer.timeString} isActive={timer.isActive} layout={layoutMode} />
              )}
            </div>

            {/* Kolom Kanan Compact */}
            <div className={cn("flex flex-col gap-3 z-10", "flex-1 overflow-visible")}>
              <RiveCharacter
                isActive={timer.isActive}
                isExpanded={false}
                mode={timer.mode}
                mood={currentMood}
                xpPercent={game.xpPercent}
                ascii={ascii}
              />
            </div>
          </>
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
