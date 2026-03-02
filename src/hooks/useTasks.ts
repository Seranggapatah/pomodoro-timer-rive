import { useLocalStorage } from "./useLocalStorage";
import type { Task } from "../types";

/**
 * Hook untuk mengelola daftar task (CRUD) + progress tracking.
 * Tasks disimpan ke localStorage secara otomatis.
 */
export function useTasks() {
    const [tasks, setTasks] = useLocalStorage<Task[]>("pomodoro-tasks", []);
    const [newTaskText, setNewTaskText] = useLocalStorage<string>("pomodoro-draft", "");
    const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>("pomodoro-active-task", null);

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        addDashboardTask(newTaskText);
        setNewTaskText("");
    };

    const addDashboardTask = (text: string) => {
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
        setTasks([...tasks, newTask]);
    };

    const toggleTask = (id: string) => {
        setTasks(
            tasks.map((task) => {
                if (task.id === id) {
                    const willComplete = !task.completed;
                    return { ...task, completed: willComplete, completedAt: willComplete ? Date.now() : undefined };
                }
                return task;
            })
        );
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter((task) => task.id !== id));
        if (activeTaskId === id) setActiveTaskId(null);
    };

    const editTask = (id: string, newText: string) => {
        if (!newText.trim()) return;
        setTasks(tasks.map((task) =>
            task.id === id ? { ...task, text: newText.trim() } : task
        ));
    };

    /**
     * Tambah pomodoro dan durasi ke task aktif (dipanggil saat focus session selesai).
     */
    const incrementActiveTaskPomodoro = (durationMinutes: number) => {
        if (!activeTaskId) return;
        setTasks(
            tasks.map((task) =>
                task.id === activeTaskId
                    ? {
                        ...task,
                        pomodoroCount: task.pomodoroCount + 1,
                        timeSpentMinutes: (task.timeSpentMinutes || 0) + durationMinutes
                    }
                    : task
            )
        );
    };

    const archiveTask = (id: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, archived: true } : task
            )
        );
        if (activeTaskId === id) setActiveTaskId(null);
    };

    const unarchiveTask = (id: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, archived: false } : task
            )
        );
    };

    const addSubTask = (taskId: string, text: string) => {
        if (!text.trim()) return;
        setTasks(tasks.map(task => {
            if (task.id === taskId) {
                const newSub = { id: Date.now().toString(), text: text.trim(), completed: false };
                return { ...task, subtasks: [...(task.subtasks || []), newSub] };
            }
            return task;
        }));
    };

    const toggleSubTask = (taskId: string, subtaskId: string) => {
        setTasks(tasks.map(task => {
            if (task.id === taskId) {
                const updatedSubtasks = (task.subtasks || []).map(sub =>
                    sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
                );
                return { ...task, subtasks: updatedSubtasks };
            }
            return task;
        }));
    };

    const deleteSubTask = (taskId: string, subtaskId: string) => {
        setTasks(tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, subtasks: (task.subtasks || []).filter(sub => sub.id !== subtaskId) };
            }
            return task;
        }));
    };

    const editSubTask = (taskId: string, subtaskId: string, newText: string) => {
        if (!newText.trim()) return;
        setTasks(tasks.map(task => {
            if (task.id === taskId) {
                const updatedSubtasks = (task.subtasks || []).map(sub =>
                    sub.id === subtaskId ? { ...sub, text: newText.trim() } : sub
                );
                return { ...task, subtasks: updatedSubtasks };
            }
            return task;
        }));
    };

    const addTagToTask = (taskId: string, tag: string) => {
        const trimTag = tag.trim().toLowerCase();
        if (!trimTag) return;
        setTasks(tasks.map(task => {
            if (task.id !== taskId) return task;
            const existing = task.tags || [];
            if (existing.includes(trimTag)) return task;
            return { ...task, tags: [...existing, trimTag] };
        }));
    };

    const removeTagFromTask = (taskId: string, tag: string) => {
        setTasks(tasks.map(task => {
            if (task.id !== taskId) return task;
            return { ...task, tags: (task.tags || []).filter(t => t !== tag) };
        }));
    };

    return {
        tasks,
        newTaskText,
        setNewTaskText,
        activeTaskId,
        setActiveTaskId,
        addTask,
        addDashboardTask,
        toggleTask,
        deleteTask,
        editTask,
        incrementActiveTaskPomodoro,
        archiveTask,
        unarchiveTask,
        addSubTask,
        toggleSubTask,
        deleteSubTask,
        editSubTask,
        addTagToTask,
        removeTagFromTask,
    };
}
