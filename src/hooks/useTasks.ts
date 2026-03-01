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

        const newTask: Task = {
            id: Date.now().toString(),
            text: newTaskText.trim(),
            completed: false,
            pomodoroCount: 0,
        };

        setTasks([...tasks, newTask]);
        setNewTaskText("");
    };

    const toggleTask = (id: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter((task) => task.id !== id));
        if (activeTaskId === id) setActiveTaskId(null);
    };

    /**
     * Tambah 1 pomodoro ke task aktif (dipanggil saat focus session selesai).
     */
    const incrementActiveTaskPomodoro = () => {
        if (!activeTaskId) return;
        setTasks(
            tasks.map((task) =>
                task.id === activeTaskId
                    ? { ...task, pomodoroCount: task.pomodoroCount + 1 }
                    : task
            )
        );
    };

    return {
        tasks,
        newTaskText,
        setNewTaskText,
        activeTaskId,
        setActiveTaskId,
        addTask,
        toggleTask,
        deleteTask,
        incrementActiveTaskPomodoro,
    };
}
