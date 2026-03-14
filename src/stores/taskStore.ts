import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task } from "../types";

// ---------------------------------------------------------------------------
function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

// ---------------------------------------------------------------------------
interface TaskState {
    tasks: Task[];
    newTaskText: string;
    activeTaskId: string | null;

    setNewTaskText: (v: string) => void;
    setActiveTaskId: (v: string | null) => void;
    submitNewTask: () => void;
    addDashboardTask: (text: string) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    editTask: (id: string, newText: string) => void;
    incrementActiveTaskPomodoro: (durationMinutes: number) => void;
    archiveTask: (id: string) => void;
    unarchiveTask: (id: string) => void;
    addSubTask: (taskId: string, text: string) => void;
    toggleSubTask: (taskId: string, subtaskId: string) => void;
    deleteSubTask: (taskId: string, subtaskId: string) => void;
    editSubTask: (taskId: string, subtaskId: string, newText: string) => void;
    addTagToTask: (taskId: string, tag: string) => void;
    removeTagFromTask: (taskId: string, tag: string) => void;
}

// ---------------------------------------------------------------------------
export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            tasks: readLS<Task[]>("pomodoro-tasks", []),
            newTaskText: readLS<string>("pomodoro-draft", ""),
            activeTaskId: readLS<string | null>("pomodoro-active-task", null),

            setNewTaskText: (v) => set({ newTaskText: v }),
            setActiveTaskId: (v) => set({ activeTaskId: v }),

            submitNewTask: () => {
                const { newTaskText } = get();
                if (!newTaskText.trim()) return;
                get().addDashboardTask(newTaskText);
                set({ newTaskText: "" });
            },

            addDashboardTask: (text) => {
                if (!text.trim()) return;
                const newTask: Task = {
                    id: Date.now().toString(),
                    text: text.trim(),
                    completed: false,
                    pomodoroCount: 0,
                    subtasks: [],
                    createdAt: Date.now(),
                    timeSpentMinutes: 0,
                };
                set((s) => ({ tasks: [...s.tasks, newTask] }));
            },

            toggleTask: (id) =>
                set((s) => ({
                    tasks: s.tasks.map((t) => {
                        if (t.id !== id) return t;
                        const willComplete = !t.completed;
                        return {
                            ...t,
                            completed: willComplete,
                            completedAt: willComplete ? Date.now() : undefined,
                        };
                    }),
                })),

            deleteTask: (id) =>
                set((s) => ({
                    tasks: s.tasks.filter((t) => t.id !== id),
                    activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
                })),

            editTask: (id, newText) => {
                if (!newText.trim()) return;
                set((s) => ({
                    tasks: s.tasks.map((t) =>
                        t.id === id ? { ...t, text: newText.trim() } : t
                    ),
                }));
            },

            incrementActiveTaskPomodoro: (durationMinutes) => {
                const { activeTaskId } = get();
                if (!activeTaskId) return;
                set((s) => ({
                    tasks: s.tasks.map((t) =>
                        t.id === activeTaskId
                            ? {
                                  ...t,
                                  pomodoroCount: t.pomodoroCount + 1,
                                  timeSpentMinutes:
                                      (t.timeSpentMinutes || 0) + durationMinutes,
                              }
                            : t
                    ),
                }));
            },

            archiveTask: (id) =>
                set((s) => ({
                    tasks: s.tasks.map((t) =>
                        t.id === id ? { ...t, archived: true } : t
                    ),
                    activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
                })),

            unarchiveTask: (id) =>
                set((s) => ({
                    tasks: s.tasks.map((t) =>
                        t.id === id ? { ...t, archived: false } : t
                    ),
                })),

            addSubTask: (taskId, text) => {
                if (!text.trim()) return;
                set((s) => ({
                    tasks: s.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        const newSub = {
                            id: Date.now().toString(),
                            text: text.trim(),
                            completed: false,
                        };
                        return {
                            ...t,
                            subtasks: [...(t.subtasks || []), newSub],
                        };
                    }),
                }));
            },

            toggleSubTask: (taskId, subtaskId) =>
                set((s) => ({
                    tasks: s.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        return {
                            ...t,
                            subtasks: (t.subtasks || []).map((sub) =>
                                sub.id === subtaskId
                                    ? { ...sub, completed: !sub.completed }
                                    : sub
                            ),
                        };
                    }),
                })),

            deleteSubTask: (taskId, subtaskId) =>
                set((s) => ({
                    tasks: s.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        return {
                            ...t,
                            subtasks: (t.subtasks || []).filter(
                                (sub) => sub.id !== subtaskId
                            ),
                        };
                    }),
                })),

            editSubTask: (taskId, subtaskId, newText) => {
                if (!newText.trim()) return;
                set((s) => ({
                    tasks: s.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        return {
                            ...t,
                            subtasks: (t.subtasks || []).map((sub) =>
                                sub.id === subtaskId
                                    ? { ...sub, text: newText.trim() }
                                    : sub
                            ),
                        };
                    }),
                }));
            },

            addTagToTask: (taskId, tag) => {
                const trimTag = tag.trim().toLowerCase();
                if (!trimTag) return;
                set((s) => ({
                    tasks: s.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        const existing = t.tags || [];
                        if (existing.includes(trimTag)) return t;
                        return { ...t, tags: [...existing, trimTag] };
                    }),
                }));
            },

            removeTagFromTask: (taskId, tag) =>
                set((s) => ({
                    tasks: s.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        return {
                            ...t,
                            tags: (t.tags || []).filter((tg) => tg !== tag),
                        };
                    }),
                })),
        }),
        {
            name: "pomodoro-task-store",
        }
    )
);
