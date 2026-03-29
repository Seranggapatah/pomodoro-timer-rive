
import type { TimelineLog } from '../types';
import { History, Coffee, Sparkles } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface TimelineHistoryProps {
    logs: TimelineLog[];
}

function formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

export function TimelineHistory({ logs }: TimelineHistoryProps) {
    const header = (
        <>
            <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                    <History size={14} className="text-orange-400" />
                    <span className="card-title">ACTIVITY LOG</span>
                </div>
            </div>

            <div className="border-t border-stone-100 mb-3" />
        </>
    );

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white w-full h-full max-h-[300px] overflow-hidden">
                {header}
                <Separator className="my-0" />
                <div className="flex-1 flex items-center justify-center p-4 mt-3 border border-dashed border-stone-200 rounded-xl">
                    <p className="body-sm italic text-stone-400">No activity yet.</p>
                </div>
            </div>
        );
    }

    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);

    if (todayLogs.length === 0) {
        return (
            <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white w-full h-full max-h-[300px] overflow-hidden">
                {header}
                <Separator className="my-0" />
                <div className="flex-1 flex items-center justify-center p-4 mt-3 border border-dashed border-stone-200 rounded-xl">
                    <p className="body-sm italic text-stone-400">No activity today.</p>
                </div>
            </div>
        );
    }

    const recentLogs = [...todayLogs].reverse().slice(0, 4);

    return (
        <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white w-full h-full max-h-[220px] overflow-hidden">
            {header}
            <Separator className="my-0" />

            <div className="flex-1 mt-1 divide-y divide-stone-50">
                {recentLogs.map((log) => {
                    const timeStr = formatTime(log.timestamp);
                    const isFocus = log.type === "focus";

                    return (
                        <div key={log.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                            {/* Left icon */}
                            {isFocus ? <Sparkles size={14} className="text-stone-300" /> : <Coffee size={14} className="text-stone-300" />}
                            
                            {/* Time */}
                            <span className="text-[10px] font-mono text-stone-400 w-8 shrink-0">{timeStr}</span>
                            
                            {/* Name */}
                            <span className="text-xs font-medium text-stone-600 flex-1 truncate">
                                {isFocus ? (log.taskName || "Focus Session") : "Break Time"}
                            </span>
                            
                            {/* Duration */}
                            <span className="text-[10px] font-mono text-stone-400 shrink-0">{log.durationMinutes}m</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
