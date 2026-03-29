import { CalendarRange } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function YearProgress() {
    const now = new Date();
    const year = now.getFullYear();

    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;

    const startOfYear = new Date(year, 0, 1);
    const diffTime = now.getTime() - startOfYear.getTime();
    const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const percent = Math.round((passedDays / totalDays) * 100);

    return (
        <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white w-full overflow-hidden shrink-0">
            <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                    <CalendarRange size={14} className="text-orange-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">YEAR PROGRESS</span>
                </div>
                <div className="bg-stone-100 text-[10px] font-medium text-stone-500 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-200/50 uppercase tracking-widest">
                    {year} • <span className="text-stone-800 font-bold">{percent}%</span>
                </div>
            </div>
            
            <Separator className="my-0" />

            {/* Dot Grid */}
            <div className="flex flex-col gap-3 mt-3">
                <div className="flex flex-wrap gap-[3px]">
                {Array.from({ length: totalDays }).map((_, i) => {
                    const isPassed = i < passedDays - 1;
                    const isToday = i === passedDays - 1;

                    return (
                        <div
                            key={i}
                            title={`Day ${i + 1}`}
                            className={[
                                "w-[6px] h-[6px] rounded-[1px] transition-all duration-200",
                                isToday
                                    ? "bg-orange-500 scale-125 animate-pulse"
                                    : isPassed
                                        ? "bg-orange-500/40"
                                        : "bg-stone-100",
                            ].join(" ")}
                        />
                    );
                })}
                </div>

            {/* Progress bar */}
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="w-full text-center text-[9px] font-medium tracking-widest uppercase text-stone-400 mt-1">
                    {passedDays} of {totalDays} DAYS PASSED
                </div>
            </div>
        </div>
    );
}
