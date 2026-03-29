import { useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2, ListTodo, Timer } from "lucide-react";
import type { Task } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

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
        <Card className="flex flex-col p-4 gap-0 border border-stone-200 bg-white w-full rounded-xl shrink-0">
            <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                    <ListTodo size={14} className="text-orange-400" />
                    <span className="card-title">TODAY'S TASKS</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">
                        {completedCount}/{unarchivedTasks.length}
                    </span>
                    <span 
                        onClick={onOpenDashboard}
                        className="text-[10px] font-medium text-orange-500 cursor-pointer hover:underline ml-2"
                    >
                        DASHBOARD →
                    </span>
                </div>
            </div>
            
            <div className="border-t border-stone-100 mb-3" />

            <div className="flex flex-col gap-2 h-full">
                <div className="relative flex bg-stone-100 rounded-lg p-1 w-full mb-3">
                    <div
                        className="absolute top-1 bottom-1 rounded-md bg-white shadow-sm transition-all duration-200 ease-out"
                        style={{
                            width: `calc(33.333% - 2.66px)`,
                            left: `calc(${["all", "active", "done"].indexOf(filter)} * 33.333% + 4px)`
                        }}
                    />
                    {(["all", "active", "done"] as const).map((tab) => {
                        const isSelected = filter === tab;
                        const activeTaskCount = unarchivedTasks.filter(t => !t.completed).length;

                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setFilter(tab)}
                                className={`relative z-10 flex-1 flex items-center justify-center py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors duration-200 cursor-pointer ${
                                    isSelected ? "text-stone-700" : "text-stone-400 hover:text-stone-500"
                                }`}
                            >
                                {tab}
                                {tab === "active" && activeTaskCount > 0 && (
                                    <span className="ml-1.5 bg-orange-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 inline-flex items-center justify-center leading-none pb-[1px]">
                                        {activeTaskCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Form tambah task */}
                <form onSubmit={onAddTask} className="flex gap-2 items-center mb-1">
                    <Input
                        type="text"
                        placeholder="What are you working on?"
                        value={newTaskText}
                        onChange={(e) => onNewTaskTextChange(e.target.value)}
                        className="flex-1 bg-background h-9 text-sm"
                    />
                    <Button type="submit" disabled={!newTaskText.trim()} size="icon" className="shrink-0 cursor-pointer h-9 w-9">
                        <Plus size={16} />
                    </Button>
                </form>

                <div className="relative mt-1">
                    <ScrollArea className="h-[180px]">
                        <div className="flex flex-col gap-1.5 pr-2">
                            {tasks.length === 0 ? (
                                <div className="h-[80px] flex flex-col items-center justify-center gap-1 mt-4">
                                    <ListTodo size={20} className="text-stone-200" />
                                    <span className="text-[11px] text-stone-300">
                                        No tasks yet — add one above
                                    </span>
                                </div>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task) => {
                                    const isActive = activeTaskId === task.id;
                                    return (
                                        <div
                                            key={task.id}
                                            className={`group h-11 flex items-center justify-between p-2 rounded-xl transition-all ${
                                                isActive
                                                    ? "relative pl-3 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-orange-500 before:rounded-full bg-orange-50/50"
                                                    : "border border-transparent hover:bg-stone-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <button
                                                    onClick={() => onToggleTask(task.id)}
                                                    className="shrink-0 text-stone-300 hover:text-orange-500 transition-colors"
                                                >
                                                    {task.completed ? (
                                                        <CheckCircle2 size={16} className="text-stone-400" />
                                                    ) : (
                                                        <Circle size={16} />
                                                    )}
                                                </button>
                                                
                                                <span 
                                                    onClick={() => onSetActiveTask(isActive ? null : task.id)}
                                                    className={`text-[12px] font-medium truncate overflow-hidden whitespace-nowrap max-w-[140px] cursor-pointer ${
                                                        task.completed ? "line-through text-stone-400" : "text-stone-700 hover:text-orange-600 transition-colors"
                                                    }`}
                                                    title={task.text}
                                                >
                                                    {task.text}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {task.pomodoroCount > 0 && (
                                                    <span className="flex items-center gap-0.5 bg-orange-50 border border-orange-100 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-orange-600 shrink-0">
                                                        <Timer size={10} /> {task.pomodoroCount}
                                                    </span>
                                                )}

                                                <button
                                                    onClick={() => onDeleteTask(task.id)}
                                                    className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-[80px] flex flex-col items-center justify-center gap-1 mt-4">
                                    <span className="text-[11px] text-stone-300 italic">
                                        No {filter} tasks
                                    </span>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    
                    {filteredTasks.length > 4 && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-white to-transparent" />
                    )}
                </div>
            </div>
        </Card>
    );
}
