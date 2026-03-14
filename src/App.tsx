import { useState, useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import type { RiveMood } from "./types";
import { Clock, Maximize2, Bug, Gamepad2 } from "lucide-react";
// ── Zustand stores ──────────────────────────────────────────────────────────
import { useSettingsStore } from "./stores/settingsStore";
import { useTaskStore } from "./stores/taskStore";
import { useThemeStore } from "./stores/themeStore";
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
import { useAutoStart } from "./hooks/useAutoStart";
import { useSlabPixelTracker } from "./hooks/useSlabPixelTracker";

// ── Components ──────────────────────────────────────────────────────────────
import { TitleBar } from "./components/TitleBar";
import { TimerMillis } from "./components/TimerMillis";
import { TimerControls } from "./components/TimerControls";
import { TaskList } from "./components/TaskList";
import { ModeToggle } from "./components/ModeToggle";
import { RiveCharacter } from "./components/RiveCharacter";
import { SettingsPanel } from "./components/SettingsPanel";
import { ThemeSelector } from "./components/ThemeSelector";
import { StatsDisplay } from "./components/StatsDisplay";
import { AmbientToggle } from "./components/AmbientToggle";
import { AsciiToggle } from "./components/AsciiToggle";
import { WeeklyDashboard } from "./components/WeeklyDashboard";
import { GameStats } from "./components/GameStats";
import { NotesPanel } from "./components/NotesPanel";
import { TaskDashboardOverlay } from "./components/TaskDashboardOverlay";
import { XPDisplay } from "./components/XPDisplay";
import { TimelineHistory } from "./components/TimelineHistory";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { HourlyChart } from "./components/HourlyChart";
import { BreakOverlay } from "./components/BreakOverlay";
import { RemindersPanel } from "./components/RemindersPanel";
import { ReminderAlert } from "./components/ReminderAlert";
import { SlabPixelWidget } from "./components/SlabPixelWidget";
import { DebugPanel } from "./components/DebugPanel";
import { YearProgress } from "./components/YearProgress";
import { WeatherWidget } from "./components/WeatherWidget";
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
    ascii, patchAscii,
  } = useSettingsStore();

  const isExpanded = layoutMode === "expanded";

  const tasks = useTaskStore();
  const { themeName, setThemeName } = useThemeStore();
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
  const sysAutoStart = useAutoStart();
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
    <div className={`app-container ${timer.mode}`}>
      {layoutMode !== "mini" && (
        <TitleBar
          mode={timer.mode}
          layoutMode={layoutMode}
          isTrackerActive={!slabPixel.stopped && !slabPixel.paused && !!slabPixel.trackerTime}
          onSetLayout={setLayoutMode}
        />
      )}

      <div className={`main-content ${layoutMode}`} data-tauri-drag-region>
        {layoutMode === "mini" ? (
          <div className="mini-mode-row" data-tauri-drag-region>
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
              <div className={`timer-display mini${!timer.isActive ? " idle" : ""}`} data-tauri-drag-region>
                {timer.timeString}
                <TimerMillis msLeftRef={timer.msLeftRef} isActive={timer.isActive} className={`timer-ms mini ${timer.isActive ? "running" : ""}`} />
              </div>

              {showTracker && (
                <div className="mini-tracker-display" title="SlabPixel Tracker Timer">
                  <Clock size={10} style={{ marginRight: 4 }} />
                  {slabPixel.isLoading && !slabPixel.trackerTime ? "loading..." : (slabPixel.trackerTime || "—")}
                  {slabPixel.paused && !slabPixel.stopped && slabPixel.trackerTime ? " [P]" : ""}
                </div>
              )}

              {timer.mode === "break" ? (() => {
                const progress = timer.totalModeMs > 0 ? (1 - timer.msLeft / timer.totalModeMs) : 0;
                const barW = 8;
                const filled = Math.floor(progress * barW);
                const bar = "█".repeat(filled) + "░".repeat(barW - filled);
                return (
                  <div className="mini-break-block">
                    <span className="mini-break-bar">[{bar}]</span>
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
        ) : (
          <>
            {/* Kolom Kiri */}
            <div className={`left-column ${layoutMode}`}>
              {isExpanded ? (
                <div className="timer-panel">
                  <div className={`timer-display ${layoutMode}${!timer.isActive ? " idle" : ""}`}>
                    {timer.timeString}
                    <TimerMillis msLeftRef={timer.msLeftRef} isActive={timer.isActive} className={`timer-ms ${layoutMode} ${timer.isActive ? "running" : ""}`} />
                  </div>

                  {timer.mode === "break" && (
                    <BreakOverlay msLeft={timer.msLeft} totalMs={timer.totalModeMs} timeString={timer.timeString} isActive={timer.isActive} layout={layoutMode} />
                  )}

                  <TimerControls
                    isActive={timer.isActive}
                    layout={layoutMode}
                    onToggle={timer.toggleTimer}
                    onReset={timer.resetTimer}
                    onComplete={timer.completeSession}
                  />
                </div>
              ) : (
                <>
                  <div className={`timer-display ${layoutMode}${!timer.isActive ? " idle" : ""}`}>
                    {timer.timeString}
                    <TimerMillis msLeftRef={timer.msLeftRef} isActive={timer.isActive} className={`timer-ms ${layoutMode} ${timer.isActive ? "running" : ""}`} />
                  </div>

                  {showTracker && (
                    <div className="compact-tracker-display" title="SlabPixel Tracker Timer">
                      <Clock size={12} style={{ marginRight: 6 }} />
                      {slabPixel.isLoading && !slabPixel.trackerTime ? "loading..." : (slabPixel.trackerTime || "—")}
                      {slabPixel.paused && !slabPixel.stopped && slabPixel.trackerTime ? " (Paused)" : ""}
                    </div>
                  )}

                  <TimerControls
                    isActive={timer.isActive}
                    layout={layoutMode}
                    onToggle={timer.toggleTimer}
                    onReset={timer.resetTimer}
                    onComplete={timer.completeSession}
                  />
                </>
              )}

              {!isExpanded && (() => {
                const activeTask = tasks.tasks.find(t => t.id === tasks.activeTaskId && !t.completed && !t.archived);
                return activeTask ? (
                  <div className={`compact-active-task ${timer.isActive ? "running" : ""}`}>
                    <span className="compact-active-task-prefix">▶</span>
                    <span className="compact-active-task-text" title={activeTask.text}>
                      {activeTask.text}
                    </span>
                  </div>
                ) : null;
              })()}

              {!isExpanded && timer.mode === "break" && (
                <BreakOverlay msLeft={timer.msLeft} totalMs={timer.totalModeMs} timeString={timer.timeString} isActive={timer.isActive} layout={layoutMode} />
              )}

              {isExpanded && (
                <>
                  <StatsDisplay
                    todaySessions={stats.todaySessions}
                    todayFocusMinutes={stats.todayFocusMinutes}
                    sessionInCycle={timer.sessionInCycle}
                  />

                  {(() => {
                    const activeTask = tasks.tasks.find(t => t.id === tasks.activeTaskId && !t.completed && !t.archived);
                    return activeTask ? (
                      <div className={`expanded-active-task-panel ${timer.isActive ? "running" : ""}`}>
                        <div className="expanded-active-label">
                          TARGET_LOCKED <span className="blink-dot"></span>
                        </div>
                        <div className="expanded-active-title">
                          {activeTask.text}
                        </div>
                      </div>
                    ) : null;
                  })()}

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
                    isAutoStartOnLogin={sysAutoStart.isAutoStartOnLogin}
                    onFocusDurationChange={setFocusDuration}
                    onBreakDurationChange={setBreakDuration}
                    onLongBreakDurationChange={setLongBreakDuration}
                    onAutoStartChange={setAutoStart}
                    onToggleAutoStartOnLogin={sysAutoStart.toggleAutoStartOnLogin}
                  />

                  <div className="bottom-controls">
                    <WeatherWidget layoutMode={layoutMode} />
                    <ModeToggle mode={timer.mode} onSwitchMode={timer.switchMode} />
                    <AmbientToggle ambientType={ambientType} onCycle={cycleAmbient} />
                    <ThemeSelector currentTheme={themeName} onSelectTheme={setThemeName} />
                    <AsciiToggle settings={ascii} onChange={patchAscii} />
                    <button className="tray-btn" onClick={() => setIsDebugOpen(true)} title="Super Admin / Debug">
                      <Bug size={14} />
                    </button>
                    <button className="tray-btn" onClick={minimizeToTray}>
                      [minimize_to_tray]
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Kolom Kanan */}
            <div className={`right-column ${layoutMode}`}>
              {isExpanded && (
                  <div className="flappy-launcher-box" onClick={openGameWindow} title="Pecahkan skor Flappy Droid!">
                    <div className="flappy-launcher-left">
                       <Gamepad2 className="icon blink" size={16} />
                       <span>FLAPPY_DROID</span>
                    </div>
                    <div className="flappy-score-badge">
                       <span className="dim">HI_SCORE:</span> {game.flappyDroidScore}
                    </div>
                  </div>
              )}
            
              <RiveCharacter
                isActive={timer.isActive}
                isExpanded={isExpanded}
                mode={timer.mode}
                mood={currentMood}
                xpPercent={game.xpPercent}
                ascii={ascii}
              />

              {isExpanded && (
                <div className="right-panels">
                  <XPDisplay
                    level={game.level}
                    xp={game.xp}
                    xpToNextLevel={game.xpToNextLevel}
                    xpPercent={game.xpPercent}
                    totalXp={game.totalXp}
                  />
                  <SlabPixelWidget
                    data={slabPixel}
                    showTracker={showTracker}
                    onToggleTracker={() => setShowTracker((p: boolean) => !p)}
                  />
                  <TimelineHistory logs={stats.logs} />
                  <HourlyChart hourlyData={stats.hourlyProductivity} />
                  <YearProgress />
                  <ActivityHeatmap days={stats.heatmap90} />
                  <WeeklyDashboard last7Days={stats.last7Days} />
                  <GameStats
                    streak={game.streak}
                    totalSessions={game.totalSessions}
                    totalTasksCompleted={game.totalTasksCompleted}
                    level={game.level}
                    achievements={game.achievements}
                  />
                </div>
              )}
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
