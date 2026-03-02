import { useState } from "react";
import { X, CheckCircle2, Circle, Archive, RotateCcw, Trash2, Plus, CornerDownRight, Edit2, Tag } from "lucide-react";
import type { Task } from "../types";

interface TaskDashboardOverlayProps {
    tasks: Task[];
    onClose: () => void;
    onAddTask: (text: string) => void;
    onToggleTask: (id: string) => void;
    onArchiveTask: (id: string) => void;
    onUnarchiveTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onAddSubTask: (taskId: string, text: string) => void;
    onToggleSubTask: (taskId: string, subtaskId: string) => void;
    onDeleteSubTask: (taskId: string, subtaskId: string) => void;
    onEditTask: (id: string, newText: string) => void;
    onEditSubTask: (taskId: string, subtaskId: string, newText: string) => void;
    onAddTag: (taskId: string, tag: string) => void;
    onRemoveTag: (taskId: string, tag: string) => void;
}

export function TaskDashboardOverlay({
    tasks,
    onClose,
    onAddTask,
    onToggleTask,
    onArchiveTask,
    onUnarchiveTask,
    onDeleteTask,
    onAddSubTask,
    onToggleSubTask,
    onDeleteSubTask,
    onEditTask,
    onEditSubTask,
    onAddTag,
    onRemoveTag,
}: TaskDashboardOverlayProps) {
    const [newTaskText, setNewTaskText] = useState("");
    const [draftSubTask, setDraftSubTask] = useState<Record<string, string>>({});
    const [tagDraft, setTagDraft] = useState<Record<string, string>>({}); // tag draft per task
    const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null); // filter by tag

    // Edit state
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingSubTaskId, setEditingSubTaskId] = useState<{ taskId: string, subtaskId: string } | null>(null);
    const [editDraftText, setEditDraftText] = useState("");

    // Kumpulkan semua tag unik dari semua task
    const allTags = Array.from(
        new Set(tasks.flatMap(t => t.tags || []))
    ).sort();

    // Categorize (apply tag filter)
    const filterFn = (t: Task) => !activeTagFilter || (t.tags || []).includes(activeTagFilter);
    const activeTasks = tasks.filter((t) => !t.completed && !t.archived && filterFn(t));
    const completedTasks = tasks.filter((t) => t.completed && !t.archived && filterFn(t));
    const archivedTasks = tasks.filter((t) => t.archived && filterFn(t));
    const upcomingTasks = activeTasks.filter((t) => t.pomodoroCount === 0);

    const formatDateTime = (timestamp: number | string | undefined) => {
        if (!timestamp) return "-";
        const d = typeof timestamp === 'string' ? new Date(parseInt(timestamp)) : new Date(timestamp);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatTimeSpent = (minutes: number | undefined) => {
        if (!minutes || minutes === 0) return "0m";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            onAddTask(newTaskText);
            setNewTaskText("");
        }
    };

    const handleAddSubTask = (taskId: string, e: React.FormEvent) => {
        e.preventDefault();
        const text = draftSubTask[taskId];
        if (text && text.trim()) {
            onAddSubTask(taskId, text);
            setDraftSubTask(prev => ({ ...prev, [taskId]: "" }));
        }
    };

    const renderTaskList = (list: Task[], title: string, showEmpty: boolean = true) => (
        <div className="task-dashboard-group">
            <h3 className="task-dashboard-group-title">
                {title} <span className="task-dashboard-group-count">[{list.length}]</span>
            </h3>
            {list.length === 0 && showEmpty ? (
                <div className="task-list-empty">no tasks in this category</div>
            ) : (
                <div className="task-dashboard-list">
                    {list.map((task) => (
                        <div key={task.id} className="task-item dashboard-task-item">
                            <div className="task-item-main">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <button
                                        style={{ padding: 0, flex: '0 0 auto' }}
                                        onClick={() => onToggleTask(task.id)}
                                        className="task-toggle-btn"
                                        disabled={task.archived}
                                    >
                                        {task.completed ? (
                                            <CheckCircle2 size={16} className="task-icon-done" />
                                        ) : (
                                            <Circle size={16} className="task-icon-pending" />
                                        )}
                                    </button>

                                    {editingTaskId === task.id ? (
                                        <form
                                            style={{ flex: 1, display: "flex" }}
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (editDraftText.trim()) onEditTask(task.id, editDraftText);
                                                setEditingTaskId(null);
                                            }}>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="subtask-input"
                                                style={{ fontSize: '13px' }}
                                                value={editDraftText}
                                                onChange={(e) => setEditDraftText(e.target.value)}
                                                onBlur={() => {
                                                    if (editDraftText.trim()) onEditTask(task.id, editDraftText);
                                                    setEditingTaskId(null);
                                                }}
                                            />
                                        </form>
                                    ) : (
                                        <span
                                            className={`task-text ${task.completed ? "completed" : "active"} ${task.archived ? "archived" : ""}`}
                                            onDoubleClick={() => {
                                                if (!task.completed && !task.archived) {
                                                    setEditingTaskId(task.id);
                                                    setEditDraftText(task.text);
                                                }
                                            }}
                                            title={!task.completed && !task.archived ? "Double click to edit" : ""}
                                            style={{ cursor: !task.completed && !task.archived ? "text" : "default", flex: 1, textAlign: 'left' }}
                                        >
                                            {task.text}
                                        </span>
                                    )}
                                </div>

                                {task.pomodoroCount > 0 && (
                                    <span className="task-pomodoro-count">🍅{task.pomodoroCount}</span>
                                )}

                                <div className="dashboard-task-actions">
                                    {!task.archived && !task.completed && (
                                        <button
                                            onClick={() => {
                                                setEditingTaskId(task.id);
                                                setEditDraftText(task.text);
                                            }}
                                            className="task-action-btn"
                                            title="Edit Task"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                    {!task.archived ? (
                                        <button
                                            onClick={() => onArchiveTask(task.id)}
                                            className="task-action-btn"
                                            title="Archive Task"
                                        >
                                            <Archive size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onUnarchiveTask(task.id)}
                                            className="task-action-btn"
                                            title="Unarchive Task"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDeleteTask(task.id)}
                                        className="task-action-btn delete"
                                        title="Delete Task permanently"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Tags */}
                            {(task.tags || []).length > 0 && (
                                <div className="task-tags">
                                    {(task.tags || []).map(tag => (
                                        <span key={tag} className="task-tag">
                                            #{tag}
                                            {!task.archived && !task.completed && (
                                                <button
                                                    className="task-tag-remove"
                                                    onClick={() => onRemoveTag(task.id, tag)}
                                                    title="Remove tag"
                                                >×</button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Tag input */}
                            {!task.archived && !task.completed && (
                                <form
                                    className="tag-input-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const val = tagDraft[task.id]?.trim();
                                        if (val) {
                                            onAddTag(task.id, val);
                                            setTagDraft(prev => ({ ...prev, [task.id]: "" }));
                                        }
                                    }}
                                >
                                    <Tag size={10} style={{ color: "var(--text-muted)" }} />
                                    <input
                                        type="text"
                                        className="tag-input"
                                        placeholder="add tag..."
                                        value={tagDraft[task.id] || ""}
                                        onChange={(e) => setTagDraft(prev => ({ ...prev, [task.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
                                            if (e.key === " " || e.key === ",") {
                                                e.preventDefault();
                                                const val = tagDraft[task.id]?.trim();
                                                if (val) {
                                                    onAddTag(task.id, val);
                                                    setTagDraft(prev => ({ ...prev, [task.id]: "" }));
                                                }
                                            }
                                        }}
                                    />
                                </form>
                            )}

                            {/* Extended Report */}
                            <div className="task-meta-report">
                                <div className="meta-item" title="Created On">
                                    <span className="meta-icon">🗓️</span>
                                    <span>{formatDateTime(task.createdAt || task.id)}</span>
                                </div>
                                {task.completedAt ? (
                                    <div className="meta-item" title="Completed On">
                                        <span className="meta-icon">✅</span>
                                        <span>{formatDateTime(task.completedAt)}</span>
                                    </div>
                                ) : null}
                                <div className="meta-item" title="Sessions (Pomodoros)">
                                    <span className="meta-icon">🍅</span>
                                    <span>{task.pomodoroCount} sessions</span>
                                </div>
                                <div className="meta-item" title="Total Time Spent">
                                    <span className="meta-icon">⏱️</span>
                                    <span>{formatTimeSpent(task.timeSpentMinutes)}</span>
                                </div>
                            </div>

                            {/* Subtask list */}
                            {(task.subtasks?.length ?? 0) > 0 && (
                                <div className="subtask-list">
                                    {task.subtasks?.map((sub) => (
                                        <div key={sub.id} className="subtask-item">
                                            <CornerDownRight size={12} className="subtask-icon-branch" />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                                <button
                                                    style={{ padding: 0, flex: '0 0 auto' }}
                                                    onClick={() => onToggleSubTask(task.id, sub.id)}
                                                    className="task-toggle-btn subtask"
                                                    disabled={task.archived}
                                                >
                                                    {sub.completed ? (
                                                        <CheckCircle2 size={14} className="task-icon-done" />
                                                    ) : (
                                                        <Circle size={14} className="task-icon-pending" />
                                                    )}
                                                </button>

                                                {editingSubTaskId?.subtaskId === sub.id ? (
                                                    <form
                                                        style={{ flex: 1, display: "flex" }}
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            if (editDraftText.trim()) onEditSubTask(task.id, sub.id, editDraftText);
                                                            setEditingSubTaskId(null);
                                                        }}>
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            className="subtask-input"
                                                            value={editDraftText}
                                                            onChange={(e) => setEditDraftText(e.target.value)}
                                                            onBlur={() => {
                                                                if (editDraftText.trim()) onEditSubTask(task.id, sub.id, editDraftText);
                                                                setEditingSubTaskId(null);
                                                            }}
                                                        />
                                                    </form>
                                                ) : (
                                                    <span
                                                        className={`task-text subtask-text ${sub.completed ? "completed" : "active"}`}
                                                        onDoubleClick={() => {
                                                            if (!sub.completed && !task.archived) {
                                                                setEditingSubTaskId({ taskId: task.id, subtaskId: sub.id });
                                                                setEditDraftText(sub.text);
                                                            }
                                                        }}
                                                        title={!sub.completed && !task.archived ? "Double click to edit" : ""}
                                                        style={{ cursor: !sub.completed && !task.archived ? "text" : "default", flex: 1, textAlign: 'left' }}
                                                    >
                                                        {sub.text}
                                                    </span>
                                                )}
                                            </div>

                                            {!task.archived && !sub.completed && (
                                                <button
                                                    onClick={() => {
                                                        setEditingSubTaskId({ taskId: task.id, subtaskId: sub.id });
                                                        setEditDraftText(sub.text);
                                                    }}
                                                    className="task-action-btn subtask-delete"
                                                    title="Edit Subtask"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDeleteSubTask(task.id, sub.id)}
                                                className="task-action-btn delete subtask-delete"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add subtask form */}
                            {!task.archived && !task.completed && (
                                <form onSubmit={(e) => handleAddSubTask(task.id, e)} className="subtask-form">
                                    <CornerDownRight size={12} className="subtask-icon-branch" />
                                    <input
                                        type="text"
                                        placeholder="Add sub-task..."
                                        value={draftSubTask[task.id] || ""}
                                        onChange={(e) => setDraftSubTask({ ...draftSubTask, [task.id]: e.target.value })}
                                        className="subtask-input"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!(draftSubTask[task.id] || "").trim()}
                                        className="subtask-submit-btn"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="task-dashboard-overlay">
            <div className="task-dashboard-modal">
                <div className="task-dashboard-header">
                    <h2 className="task-dashboard-title">&gt; task_dashboard</h2>
                    <button onClick={onClose} className="task-dashboard-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="task-dashboard-stats">
                    <div className="td-stat-box">
                        <div className="td-stat-value">{activeTasks.length}</div>
                        <div className="td-stat-label">ACTIVE</div>
                    </div>
                    <div className="td-stat-box">
                        <div className="td-stat-value">{upcomingTasks.length}</div>
                        <div className="td-stat-label">UPCOMING</div>
                    </div>
                    <div className="td-stat-box">
                        <div className="td-stat-value">{completedTasks.length}</div>
                        <div className="td-stat-label">COMPLETED</div>
                    </div>
                    <div className="td-stat-box">
                        <div className="td-stat-value">{archivedTasks.length}</div>
                        <div className="td-stat-label">ARCHIVED</div>
                    </div>
                </div>

                {/* Tag filter bar */}
                {allTags.length > 0 && (
                    <div className="tag-filter-bar">
                        <span className="tag-filter-label"><Tag size={10} /> filter:</span>
                        <button
                            className={`tag-filter-btn ${activeTagFilter === null ? "active" : ""}`}
                            onClick={() => setActiveTagFilter(null)}
                        >all</button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`tag-filter-btn ${activeTagFilter === tag ? "active" : ""}`}
                                onClick={() => setActiveTagFilter(prev => prev === tag ? null : tag)}
                            >#{tag}</button>
                        ))}
                    </div>
                )}

                <div className="task-dashboard-content">
                    <form onSubmit={handleAddTask} className="task-form dashboard-add-form">
                        <input
                            type="text"
                            placeholder="Create a new task..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
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

                    {renderTaskList(activeTasks, "🟢 ACTIVE / UPCOMING TASKS")}
                    {renderTaskList(completedTasks, "✔️ COMPLETED TASKS")}
                    {renderTaskList(archivedTasks, "📦 ARCHIVED TASKS")}
                </div>
            </div>
        </div>
    );
}
