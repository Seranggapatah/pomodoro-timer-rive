import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import type { Task } from "../types";

interface TaskListProps {
    tasks: Task[];
    newTaskText: string;
    onNewTaskTextChange: (text: string) => void;
    onAddTask: (e: React.FormEvent) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
}

/**
 * Komponen daftar task: form input + list item.
 */
export function TaskList({
    tasks,
    newTaskText,
    onNewTaskTextChange,
    onAddTask,
    onToggleTask,
    onDeleteTask,
}: TaskListProps) {
    return (
        <div className="task-section visible">
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
            {tasks.length > 0 && (
                <div className="task-list">
                    {tasks.map((task) => (
                        <div key={task.id} className="task-item">
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
                            <button
                                onClick={() => onDeleteTask(task.id)}
                                className="task-delete-btn"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
