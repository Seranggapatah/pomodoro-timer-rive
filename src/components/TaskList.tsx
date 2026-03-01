import { useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2, Target } from "lucide-react";
import type { Task } from "../types";

interface TaskListProps {
    tasks: Task[];
    newTaskText: string;
    activeTaskId: string | null;
    onNewTaskTextChange: (text: string) => void;
    onAddTask: (e: React.FormEvent) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onSetActiveTask: (id: string | null) => void;
    onOpenDashboard: () => void;
}

/**
 * Komponen daftar task: form input + list item + progress + active selector.
 */
export function TaskList({
    tasks,
    newTaskText,
    activeTaskId,
    onNewTaskTextChange,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onSetActiveTask,
    onOpenDashboard,
}: TaskListProps) {
    const [filter, setFilter] = useState<"all" | "active" | "done">("all");

    // Hanya hitung task yang tidak di-archive
    const unarchivedTasks = tasks.filter((t) => !t.archived);
    const completedCount = unarchivedTasks.filter((t) => t.completed).length;

    const filteredTasks = unarchivedTasks.filter((task) => {
        if (filter === "active") return !task.completed;
        if (filter === "done") return task.completed;
        return true;
    });

    return (
        <div className="task-section visible">
            <div className="task-header">
                <div className="task-tabs">
                    <button
                        className={`task-tab ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        [ ALL ]
                    </button>
                    <button
                        className={`task-tab ${filter === "active" ? "active" : ""}`}
                        onClick={() => setFilter("active")}
                    >
                        [ ACTIVE ]
                    </button>
                    <button
                        className={`task-tab ${filter === "done" ? "active" : ""}`}
                        onClick={() => setFilter("done")}
                    >
                        [ DONE ]
                    </button>
                    <button
                        className="task-tab"
                        onClick={onOpenDashboard}
                    >
                        [ DASHBOARD ]
                    </button>
                </div>
                <div className="task-count">
                    {completedCount}/{unarchivedTasks.length}
                </div>
            </div>

            {/* Form tambah task */}
            <form onSubmit={onAddTask} className="task-form">
                <input
                    type="text"
                    placeholder="Add a task..."
                    value={newTaskText}
                    onChange={(e) => onNewTaskTextChange(e.target.value)}
                    className="task-input"
                />
                <button
                    type="submit"
                    disabled={!newTaskText.trim()}
                    className="task-submit-btn"
                >
                    <Plus size={18} />
                </button>
            </form>

            {/* Daftar task */}
            {filteredTasks.length > 0 ? (
                <div className="task-list">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`task-item ${activeTaskId === task.id ? "task-active" : ""}`}
                        >
                            {/* Tombol set active task */}
                            <button
                                onClick={() => onSetActiveTask(activeTaskId === task.id ? null : task.id)}
                                className={`task-target-btn ${activeTaskId === task.id ? "active" : ""}`}
                                title={activeTaskId === task.id ? "Deselect task" : "Set as active task"}
                            >
                                <Target size={14} />
                            </button>

                            <button
                                onClick={() => onToggleTask(task.id)}
                                className="task-toggle-btn"
                            >
                                {task.completed ? (
                                    <CheckCircle2 size={18} className="task-icon-done" />
                                ) : (
                                    <Circle size={18} className="task-icon-pending" />
                                )}
                                <span className={`task-text ${task.completed ? "completed" : "active"}`}>
                                    {task.text}
                                </span>
                            </button>

                            {/* Pomodoro count */}
                            {task.pomodoroCount > 0 && (
                                <span className="task-pomodoro-count">
                                    🍅{task.pomodoroCount}
                                </span>
                            )}

                            <button
                                onClick={() => onDeleteTask(task.id)}
                                className="task-delete-btn"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                tasks.length > 0 && (
                    <div className="task-list-empty">no {filter} tasks</div>
                )
            )}
        </div>
    );
}
