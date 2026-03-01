import { useState } from "react";
import type { Task } from "../types";

/**
 * Hook untuk mengelola daftar task (CRUD).
 * Menyediakan fungsi tambah, toggle selesai, dan hapus task.
 */
export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState("");

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;

        const newTask: Task = {
            id: Date.now().toString(),
            text: newTaskText.trim(),
            completed: false,
        };

        setTasks((prev) => [...prev, newTask]);
        setNewTaskText("");
    };

    const toggleTask = (id: string) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const deleteTask = (id: string) => {
        setTasks((prev) => prev.filter((task) => task.id !== id));
    };

    return {
        tasks,
        newTaskText,
        setNewTaskText,
        addTask,
        toggleTask,
        deleteTask,
    };
}
