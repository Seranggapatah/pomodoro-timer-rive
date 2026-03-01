import { useState, useCallback, useEffect } from "react";
import "./App.css";
import type { RiveMood, LayoutMode } from "./types";

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
import { WeeklyDashboard } from "./components/WeeklyDashboard";
import { GameStats } from "./components/GameStats";
import { NotesPanel } from "./components/NotesPanel";

/**
 * Komponen utama aplikasi Pomodoro Timer.
 *
 * Shortcuts: Space = Play/Pause | R = Reset | E = Expand | M = Minimize to tray
 */
function App() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("compact");
  const isExpanded = layoutMode === "expanded";
  const [riveMood, setRiveMood] = useState<RiveMood>("idle");

  // Persistent settings
  const [focusDuration, setFocusDuration] = useLocalStorage("pomodoro-focus-min", 25);
  const [breakDuration, setBreakDuration] = useLocalStorage("pomodoro-break-min", 5);
  const [longBreakDuration, setLongBreakDuration] = useLocalStorage("pomodoro-longbreak-min", 15);

  // Hooks
  const stats = useStats();
  const ambient = useAmbientSound();
  const game = useGameData();
  const { notifyTimerComplete } = useNotification();
  const tasks = useTasks();
  const notes = useNotes();
  const theme = useTheme();
  const { minimizeToTray, updateTrayTooltip } = useWindowSize(layoutMode);

  // Timer complete: notifikasi + stats + task progress + game + rive happy
  const handleTimerComplete = useCallback((completedMode: "focus" | "break") => {
    notifyTimerComplete(completedMode);
    if (completedMode === "focus") {
      stats.recordSession(focusDuration);
      tasks.incrementActiveTaskPomodoro();
      game.recordGameSession();
      setRiveMood("happy");
    }
  }, [notifyTimerComplete, stats.recordSession, focusDuration, tasks.incrementActiveTaskPomodoro, game.recordGameSession]);

  // Timer reset: rive sad
  const handleTimerReset = useCallback(() => {
    setRiveMood("sad");
  }, []);

  const timer = useTimer(focusDuration, breakDuration, longBreakDuration, handleTimerComplete, handleTimerReset);

  // Update tray tooltip setiap detik dengan countdown
  useEffect(() => {
    const modeLabel = timer.mode === "focus" ? "Focus" : "Break";
    updateTrayTooltip(`Pomodoro - ${modeLabel}: ${timer.timeString}`);
  }, [timer.timeString, timer.mode, updateTrayTooltip]);

  // Rive mood logic
  const currentMood: RiveMood = riveMood === "happy" || riveMood === "sad"
    ? riveMood
    : timer.isActive ? "working" : "idle";

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
    <div className="app-container">
      {layoutMode !== "mini" && (
        <TitleBar
          mode={timer.mode}
          isExpanded={isExpanded}
          onToggleExpand={cycleLayout}
        />
      )}

      <div className={`main-content ${layoutMode}`} data-tauri-drag-region>
        {/* Kolom Kiri */}
        <div className={`left-column ${layoutMode}`}>
          <div className={`timer-display ${layoutMode}`}>
            {timer.timeString}
          </div>

          <TimerControls
            isActive={timer.isActive}
            layout={layoutMode}
            onToggle={timer.toggleTimer}
            onReset={timer.resetTimer}
          />

          {/* Expanded-only content */}
          {isExpanded && (
            <>
              <StatsDisplay
                todaySessions={stats.todaySessions}
                todayFocusMinutes={stats.todayFocusMinutes}
                sessionInCycle={timer.sessionInCycle}
              />

              <TaskList
                tasks={tasks.tasks}
                newTaskText={tasks.newTaskText}
                activeTaskId={tasks.activeTaskId}
                onNewTaskTextChange={tasks.setNewTaskText}
                onAddTask={tasks.addTask}
                onToggleTask={tasks.toggleTask}
                onDeleteTask={tasks.deleteTask}
                onSetActiveTask={tasks.setActiveTaskId}
              />

              <NotesPanel
                note={notes.note}
                onNoteChange={notes.setNote}
              />

              <SettingsPanel
                focusDuration={focusDuration}
                breakDuration={breakDuration}
                longBreakDuration={longBreakDuration}
                onFocusDurationChange={setFocusDuration}
                onBreakDurationChange={setBreakDuration}
                onLongBreakDurationChange={setLongBreakDuration}
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
                <button className="tray-btn" onClick={minimizeToTray}>
                  [minimize_to_tray]
                </button>
              </div>
            </>
          )}
        </div>

        {/* Kolom Kanan */}
        {layoutMode !== "mini" && (
          <div className={`right-column ${layoutMode}`}>
            <RiveCharacter
              isActive={timer.isActive}
              isExpanded={isExpanded}
              mode={timer.mode}
              mood={currentMood}
            />

            {/* Dashboard & Game di bawah Rive saat expanded */}
            {isExpanded && (
              <div className="right-panels">
                <WeeklyDashboard last7Days={stats.last7Days} />
                <GameStats
                  streak={game.streak}
                  totalSessions={game.totalSessions}
                  level={game.level}
                  achievements={game.achievements}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
