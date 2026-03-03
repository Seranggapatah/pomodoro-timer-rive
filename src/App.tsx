import { useState, useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import type { RiveMood, LayoutMode } from "./types";
import { Play, Pause, X } from "lucide-react";

// Hooks
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useTimer } from "./hooks/useTimer";
import { useTasks } from "./hooks/useTasks";
import { useWindowSize } from "./hooks/useWindowSize";
import { useTheme } from "./hooks/useTheme";
import { useNotification } from "./hooks/useNotification";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useStats } from "./hooks/useStats";
import { useAmbientSound } from "./hooks/useAmbientSound";
import { useGameData } from "./hooks/useGameData";
import { useNotes } from "./hooks/useNotes";
import { useReminders } from "./hooks/useReminders";

// Components
import { TitleBar } from "./components/TitleBar";
import { TimerControls } from "./components/TimerControls";
import { TaskList } from "./components/TaskList";
import { ModeToggle } from "./components/ModeToggle";
import { RiveCharacter } from "./components/RiveCharacter";
import { SettingsPanel } from "./components/SettingsPanel";
import { ThemeSelector } from "./components/ThemeSelector";
import { StatsDisplay } from "./components/StatsDisplay";
import { AmbientToggle } from "./components/AmbientToggle";
import { AsciiToggle } from "./components/AsciiToggle";
import type { AsciiSettings } from "./components/AsciiToggle";
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

/**
 * Komponen utama aplikasi Pomodoro Timer.
 *
 * Shortcuts: Space = Play/Pause | R = Reset | E = Expand | M = Minimize to tray
 */
function App() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("compact");
  const isExpanded = layoutMode === "expanded";
  const [riveMood, setRiveMood] = useState<RiveMood>("idle");
  const [isTaskDashboardOpen, setIsTaskDashboardOpen] = useState(false);

  // ASCII filter — single settings object
  const [ascii, setAscii] = useState<AsciiSettings>({
    enabled: false,
    charset: "detailed",
    color: "#00ff88",
    charSize: 7,
    opacity: 0.9,
    colorBlend: 0.65,
  });

  const patchAscii = useCallback((patch: Partial<AsciiSettings>) => {
    setAscii(prev => ({ ...prev, ...patch }));
  }, []);

  // Persistent settings
  const [focusDuration, setFocusDuration] = useLocalStorage("pomodoro-focus-min", 25);
  const [breakDuration, setBreakDuration] = useLocalStorage("pomodoro-break-min", 5);
  const [longBreakDuration, setLongBreakDuration] = useLocalStorage("pomodoro-longbreak-min", 15);
  const [autoStart, setAutoStart] = useLocalStorage("pomodoro-autostart", false);

  // Hooks
  const stats = useStats();
  const ambient = useAmbientSound();
  const game = useGameData();
  const { notifyTimerComplete } = useNotification();
  const tasks = useTasks();
  const notes = useNotes();
  const reminders = useReminders();
  const theme = useTheme();
  const { minimizeToTray, updateTrayTimer } = useWindowSize(layoutMode);

  const handleTimerComplete = useCallback((completedMode: "focus" | "break") => {
    notifyTimerComplete(completedMode);

    // Cari nama task yang sedang aktif saat ini
    const currentActiveTask = tasks.tasks.find(t => t.id === tasks.activeTaskId && !t.completed && !t.archived);
    const taskName = currentActiveTask ? currentActiveTask.text : undefined;

    // Record timeline histori
    stats.recordTimelineLog(
      completedMode,
      completedMode === "focus" ? focusDuration : (completedMode === "break" ? breakDuration : longBreakDuration),
      completedMode === "focus" ? taskName : undefined
    );

    if (completedMode === "focus") {
      stats.recordSession(focusDuration);
      tasks.incrementActiveTaskPomodoro(focusDuration);
      game.recordGameSession(focusDuration);
      setRiveMood("happy");
    }
  }, [
    notifyTimerComplete,
    stats.recordSession,
    stats.recordTimelineLog,
    focusDuration,
    breakDuration,
    longBreakDuration,
    tasks.incrementActiveTaskPomodoro,
    game.recordGameSession,
    tasks.tasks,
    tasks.activeTaskId
  ]);


  // Timer reset: rive sad
  const handleTimerReset = useCallback(() => {
    setRiveMood("sad");
  }, []);

  const handleToggleTask = useCallback((id: string) => {
    const task = tasks.tasks.find(t => t.id === id);
    if (task && !task.completed) {
      stats.recordTaskComplete();
      game.recordTaskComplete();
    }
    tasks.toggleTask(id);
  }, [tasks.tasks, tasks.toggleTask, stats.recordTaskComplete, game.recordTaskComplete]);

  const timer = useTimer(focusDuration, breakDuration, longBreakDuration, autoStart, handleTimerComplete, handleTimerReset);

  // Update tray icon (teks timer) + tooltip setiap detik
  useEffect(() => {
    updateTrayTimer(timer.timeString, timer.mode, timer.isActive);
  }, [timer.timeString, timer.mode, timer.isActive, updateTrayTimer]);

  // Dengarkan event dari tray menu (Start/Pause & Skip)
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

  // Rive mood logic
  const currentMood: RiveMood = riveMood === "happy" || riveMood === "sad"
    ? riveMood
    : timer.isActive
      ? (timer.mode === "break" ? "idle" : "working")
      : "idle";

  // Reset mood after timeout
  if (riveMood === "happy" || riveMood === "sad") {
    setTimeout(() => setRiveMood("idle"), riveMood === "happy" ? 3100 : 2100);
  }

  // Layout Cycle Toggle
  const cycleLayout = useCallback(() => {
    setLayoutMode((prev: LayoutMode) => {
      if (prev === "compact") return "expanded";
      if (prev === "expanded") return "mini";
      return "compact";
    });
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleTimer: timer.toggleTimer,
    onResetTimer: timer.resetTimer,
    onCycleLayout: cycleLayout,
  });

  return (
    <div className={`app-container ${timer.mode}`}>
      {layoutMode !== "mini" && (
        <TitleBar
          mode={timer.mode}
          layoutMode={layoutMode}
          isActive={timer.isActive}
          onSetLayout={setLayoutMode}
        />
      )}

      <div className={`main-content ${layoutMode}`} data-tauri-drag-region>
        {layoutMode === "mini" ? (
          <div className="mini-mode-row" data-tauri-drag-region>
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
              <div className={`timer-display mini${!timer.isActive ? " idle" : ""}${currentMood === "happy" ? " session-done" : ""}`} data-tauri-drag-region>
                {timer.timeString}
                <span className={`timer-ms mini ${timer.isActive ? "running" : ""}`}>.{timer.msString}</span>
              </div>

              {/* Active task indicator / break bar — mini mode */}
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

            <div className="mini-controls-wrapper">
              <button className="mini-action-btn" onClick={timer.toggleTimer} title="Play/Pause">
                {timer.isActive ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button className="mini-action-btn close" onClick={cycleLayout} title="Exit mini mode">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Kolom Kiri */}
            <div className={`left-column ${layoutMode}`}>
              <div className={`timer-display ${layoutMode}${!timer.isActive ? " idle" : ""}${currentMood === "happy" ? " session-done" : ""}`}>
                {timer.timeString}
                <span className={`timer-ms ${layoutMode} ${timer.isActive ? "running" : ""}`}>.{timer.msString}</span>
              </div>

              {/* Break overlay — expanded mode, langsung di bawah angka timer */}
              {isExpanded && timer.mode === "break" && (
                <BreakOverlay
                  msLeft={timer.msLeft}
                  totalMs={timer.totalModeMs}
                  timeString={timer.timeString}
                  isActive={timer.isActive}
                  layout={layoutMode}
                />
              )}

              <TimerControls
                isActive={timer.isActive}
                layout={layoutMode}
                onToggle={timer.toggleTimer}
                onReset={timer.resetTimer}
                onComplete={timer.completeSession}
              />

              {/* Active task indicator — compact only */}
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

              {/* Break overlay — compact mode only */}
              {!isExpanded && timer.mode === "break" && (
                <BreakOverlay
                  msLeft={timer.msLeft}
                  totalMs={timer.totalModeMs}
                  timeString={timer.timeString}
                  isActive={timer.isActive}
                  layout={layoutMode}
                />
              )}

              {/* Expanded-only content */}
              {isExpanded && (
                <>
                  <StatsDisplay
                    todaySessions={stats.todaySessions}
                    todayFocusMinutes={stats.todayFocusMinutes}
                    sessionInCycle={timer.sessionInCycle}
                  />

                  {/* Active Task Indicator - Expanded Full size */}
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
                    onAddTask={tasks.addTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={tasks.deleteTask}
                    onSetActiveTask={tasks.setActiveTaskId}
                    onOpenDashboard={() => setIsTaskDashboardOpen(true)}
                  />

                  <NotesPanel
                    note={notes.note}
                    onNoteChange={notes.setNote}
                  />

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

                  <div className="bottom-controls">
                    <ModeToggle
                      mode={timer.mode}
                      onSwitchMode={timer.switchMode}
                    />
                    <AmbientToggle
                      ambientType={ambient.ambientType}
                      onCycle={ambient.cycleAmbient}
                    />
                    <ThemeSelector
                      currentTheme={theme.themeName}
                      onSelectTheme={theme.setThemeName}
                    />
                    <AsciiToggle
                      settings={ascii}
                      onChange={patchAscii}
                    />
                    <button className="tray-btn" onClick={minimizeToTray}>
                      [minimize_to_tray]
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Kolom Kanan */}
            <div className={`right-column ${layoutMode}`}>
              <RiveCharacter
                isActive={timer.isActive}
                isExpanded={isExpanded}
                mode={timer.mode}
                mood={currentMood}
                xpPercent={game.xpPercent}
                ascii={ascii}
              />

              {/* Dashboard & Game di bawah Rive saat expanded */}
              {isExpanded && (
                <div className="right-panels">
                  <XPDisplay
                    level={game.level}
                    xp={game.xp}
                    xpToNextLevel={game.xpToNextLevel}
                    xpPercent={game.xpPercent}
                    totalXp={game.totalXp}
                  />
                  <TimelineHistory logs={stats.logs} />
                  <HourlyChart hourlyData={stats.hourlyProductivity} />
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
      {/* In-app reminder alert — fixed overlay, dismiss dengan [×] */}
      <ReminderAlert
        alerts={reminders.alerts}
        onDismiss={reminders.dismissAlert}
      />
    </div>
  );
}

export default App;
