import type { DailyStats } from "../types";

interface WeeklyDashboardProps {
    last7Days: (DailyStats & { dayLabel: string })[];
}

export function WeeklyDashboard({ last7Days }: WeeklyDashboardProps) {
    const totalSessions = last7Days.reduce((sum, d) => sum + d.sessions, 0);
    const totalMinutes = last7Days.reduce((sum, d) => sum + d.totalFocusMinutes, 0);
    const totalTasks = last7Days.reduce((sum, d) => sum + (d.completedTasks || 0), 0);
    const maxSessions = Math.max(...last7Days.map((d) => d.sessions), 1);

    return (
        <div className="flex flex-col gap-0 w-full h-full">

            <div className="flex items-end justify-between h-32 mt-3 gap-2 pb-2 border-b border-stone-200/50">
                {last7Days.map((day) => {
                    const heightPercent = (day.sessions / maxSessions) * 100;
                    const isToday = day.date === new Date().toISOString().split("T")[0];
                    const isEmpty = day.sessions === 0;

                    return (
                        <div key={day.date} className="relative flex flex-col items-center justify-end h-full w-full group cursor-pointer">
                            <span className="text-[10px] font-bold text-stone-700 mb-1 transition-opacity opacity-0 group-hover:opacity-100">
                                {day.sessions || ""}
                            </span>
                            <div 
                                className={`w-full rounded-t-sm transition-all duration-500 ease-out origin-bottom ${isToday ? "bg-orange-500 " : isEmpty ? "bg-stone-100 border border-dashed border-stone-200/50" : "bg-orange-500/40 hover:bg-orange-500/60"}`}
                                style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                title={`${day.date}: ${day.sessions} sessions`}
                            />
                            <span className={`absolute -bottom-6 text-[9px] font-medium uppercase tracking-widest mt-2 ${isToday ? "text-orange-500 font-bold" : "text-stone-400"}`}>
                                {day.dayLabel}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-500 mt-5 tracking-widest bg-stone-50 px-3 py-2 rounded-lg border border-stone-200/50">
                <span>{totalSessions} SESSIONS</span>
                <span>{totalMinutes} MIN</span>
                <span>{totalTasks} TASKS</span>
            </div>
        </div>
    );
}
