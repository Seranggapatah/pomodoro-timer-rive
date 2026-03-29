import { useState, useEffect } from "react";
import type { Reminder } from "../types";
import { Bell, Plus, X, Circle, CheckCircle2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RemindersPanelProps {
    reminders: Reminder[];
    onAdd: (text: string, time: string) => void;
    onDelete: (id: string) => void;
    onClearTriggered: () => void;
}

export function RemindersPanel({ reminders, onAdd, onDelete, onClearTriggered }: RemindersPanelProps) {
    const [text, setText] = useState("");
    const [time, setTime] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("pomodoro-reminders-collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem("pomodoro-reminders-collapsed", String(next));
    };

    const handleAdd = () => {
        if (text.trim() && time) {
            onAdd(text, time);
            setText("");
            setTime("");
        }
    };

    const pending = reminders.filter(r => !r.triggered);
    const triggered = reminders.filter(r => r.triggered);

    return (
        <div className="flex flex-col border border-stone-200 rounded-xl bg-white w-full overflow-hidden transition-all duration-300">
            {/* Header: exactly 44px (h-11) */}
            <button 
                onClick={toggleCollapse}
                className="flex items-center justify-between px-4 h-11 w-full cursor-pointer group active:bg-stone-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Bell size={14} className="text-orange-400" />
                    <span className="card-title">PENDING REMINDERS</span>
                    
                    {pending.length > 0 && (
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                            {pending.length}
                        </span>
                    )}
                </div>
                <ChevronRight size={14} className={`text-stone-300 transition-transform duration-200 ${!isCollapsed ? "rotate-90" : "rotate-0"}`} />
            </button>
            
            <div className={`grid transition-all duration-300 ease-in-out ${isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
                <div className="overflow-hidden">
                   <div className="px-4 pb-4">
                    <div className="section-divider" />
                    
                    {triggered.length > 0 && (
                        <div className="flex items-center justify-between mb-3 bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                            <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider pl-1">
                                {triggered.length} alert{triggered.length > 1 ? "s" : ""} active!
                            </span>
                            <Button variant="ghost" size="sm" onClick={onClearTriggered} className="h-6 text-[10px] text-orange-600 hover:bg-orange-100">
                                Clear
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-2 items-center mb-3">
                        <Input
                            className="flex-1 h-8 text-xs text-stone-500 border-dashed"
                            placeholder="Add reminder..."
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAdd()}
                        />
                        <Input
                            className="w-[90px] h-8 text-[10px] border-dashed text-stone-500"
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                        />
                        <Button
                            variant="default"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={handleAdd}
                            disabled={!text.trim() || !time}
                        >
                            <Plus size={14} />
                        </Button>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                        {pending.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-stone-100 bg-stone-50 group">
                                <div className="flex items-center gap-2">
                                    <Circle size={12} className="text-stone-300" />
                                    <span className="text-[10px] font-mono text-stone-500 bg-white border border-stone-100 px-1 py-0.5 rounded-sm">{r.time}</span>
                                    <span className="text-xs font-medium text-stone-600 truncate max-w-[120px]">{r.text}</span>
                                </div>
                                <button
                                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-opacity"
                                    onClick={() => onDelete(r.id)}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        
                        {triggered.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-1.5 opacity-50 grayscale">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-stone-400" />
                                    <span className="text-[10px] font-mono line-through">{r.time}</span>
                                    <span className="text-xs line-through truncate max-w-[120px]">{r.text}</span>
                                </div>
                                <button onClick={() => onDelete(r.id)}><X size={12} className="text-stone-400" /></button>
                            </div>
                        ))}
                    </div>
                   </div>
                </div>
            </div>
        </div>
    );
}
