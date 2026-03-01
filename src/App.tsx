import { useState } from "react";
import "./App.css";

// Hooks
import { useTimer } from "./hooks/useTimer";
import { useTasks } from "./hooks/useTasks";
import { useWindowSize } from "./hooks/useWindowSize";

// Components
import { TitleBar } from "./components/TitleBar";
import { TimerControls } from "./components/TimerControls";
import { TaskList } from "./components/TaskList";
import { ModeToggle } from "./components/ModeToggle";
import { RiveCharacter } from "./components/RiveCharacter";

/**
 * Komponen utama aplikasi Pomodoro Timer.
 *
 * Struktur:
 * ┌──────────────────────────────────┐
 * │ TitleBar (drag + expand btn)     │
 * ├──────────────────────────────────┤
 * │ Left Column    │ Rive Character  │
 * │  - Timer       │                 │
 * │  - Controls    │                 │
 * │  - TaskList    │                 │
 * │  - ModeToggle  │                 │
 * └──────────────────────────────────┘
 */
function App() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Custom hooks
  const timer = useTimer();
  const tasks = useTasks();
  useWindowSize(isExpanded);

  const layout = isExpanded ? "expanded" : "compact";

  return (
    <div className="app-container">
      <TitleBar
        mode={timer.mode}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded((prev) => !prev)}
      />

      <div className={`main-content ${layout}`}>
        {/* Kolom Kiri */}
        <div className={`left-column ${layout}`}>
          <div className={`timer-display ${layout}`}>
            {timer.timeString}
          </div>

          <TimerControls
            isActive={timer.isActive}
            isExpanded={isExpanded}
            onToggle={timer.toggleTimer}
            onReset={timer.resetTimer}
          />

          {/* Task List & Mode Toggle hanya tampil saat expanded */}
          {isExpanded && (
            <>
              <TaskList
                tasks={tasks.tasks}
                newTaskText={tasks.newTaskText}
                onNewTaskTextChange={tasks.setNewTaskText}
                onAddTask={tasks.addTask}
                onToggleTask={tasks.toggleTask}
                onDeleteTask={tasks.deleteTask}
              />
              <ModeToggle
                mode={timer.mode}
                onSwitchMode={timer.switchMode}
              />
            </>
          )}
        </div>

        {/* Kolom Kanan: Karakter Rive */}
        <RiveCharacter
          isActive={timer.isActive}
          isExpanded={isExpanded}
          mode={timer.mode}
        />
      </div>
    </div>
  );
}

export default App;
