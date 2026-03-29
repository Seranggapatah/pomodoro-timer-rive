import type { HeatmapDay } from "../types";

interface ActivityHeatmapProps {
    days: HeatmapDay[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
    const totalSessions = days.reduce((s, d) => s + d.sessions, 0);


    const firstDate = days[0]?.date;
    const firstDow = firstDate
        ? new Date(firstDate + "T00:00:00").getDay()
        : 0;

    const padded: (HeatmapDay | null)[] = [
        ...Array(firstDow).fill(null),
        ...days,
    ];

    const weeks: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
        weeks.push(padded.slice(i, i + 7));
    }

    const monthLabels: string[] = weeks.map((week) => {
        for (const day of week) {
            if (!day) continue;
            const d = new Date(day.date + "T00:00:00");
            if (d.getDate() <= 7) return MONTH_NAMES[d.getMonth()];
        }
        return "";
    });

    const todayStr = new Date().toISOString().split("T")[0];

    return (
        <div className="flex flex-col gap-0 w-full overflow-hidden">

            <div className="flex flex-col mt-1 overflow-x-auto pb-4 pt-1 hide-scrollbar">
                <div className="flex gap-2.5">
                    <div className="flex flex-col gap-1.5 pt-[16px] text-[9px] font-bold text-stone-400 w-3 items-center text-center">
                        {DAY_LABELS.map((d, i) => (
                            <span key={i} className="h-4 flex items-center shrink-0 uppercase">{i % 2 === 1 ? d : ""}</span>
                        ))}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex h-3">
                            {monthLabels.map((label, i) => (
                                <span key={i} className="text-[10px] inline-block font-bold uppercase tracking-wider text-stone-400 w-4 mr-1 shrink-0">{label}</span>
                            ))}
                        </div>

                        <div className="flex gap-1.5">
                            {weeks.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-1.5">
                                    {Array.from({ length: 7 }, (_, di) => {
                                        const cell = week[di];
                                        if (!cell) return <div key={di} className="w-4 h-4 rounded-[4px] bg-transparent" />;
                                        
                                        const isToday = cell.date === todayStr;
                                        
                                        let bgClass = "bg-stone-100 border border-stone-200/50";
                                        if (cell.level === 1) bgClass = "bg-orange-500/20 border border-orange-500/10";
                                        if (cell.level === 2) bgClass = "bg-orange-500/40 border border-orange-500/20";
                                        if (cell.level === 3) bgClass = "bg-orange-500/70 border border-orange-500/40 text-white";
                                        if (cell.level === 4) bgClass = "bg-orange-500 border border-orange-500 text-white";

                                        return (
                                            <div
                                                key={di}
                                                className={`w-4 h-4 rounded-[4px] transition-all hover:scale-125 hover:rotate-3 cursor-pointer ${bgClass} ${isToday ? "ring-2 ring-stone-800 ring-offset-2 ring-offset-white" : ""}`}
                                                title={`${cell.date}: ${cell.sessions} session${cell.sessions !== 1 ? "s" : ""}`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-stone-100 my-2" />
            
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium uppercase tracking-widest mt-1">
                <span>{totalSessions} TOTAL SESSIONS</span>
                <div className="flex items-center gap-2">
                    <span>Less</span>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-stone-100 border border-stone-200/50"></div>
                        <div className="w-3 h-3 rounded-sm bg-orange-500/20 border border-orange-500/10"></div>
                        <div className="w-3 h-3 rounded-sm bg-orange-500/40 border border-orange-500/20"></div>
                        <div className="w-3 h-3 rounded-sm bg-orange-500/70 border border-orange-500/40"></div>
                        <div className="w-3 h-3 rounded-sm bg-orange-500 border border-orange-500"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
