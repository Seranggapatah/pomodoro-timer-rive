import { Progress } from "@/components/ui/progress";

interface StatsDisplayProps {
    todaySessions: number;
    todayFocusMinutes: number;
    sessionInCycle: number;
}

export function StatsDisplay({ todaySessions, todayFocusMinutes, sessionInCycle }: StatsDisplayProps) {
    const cycleProgress = (sessionInCycle / 4) * 100;

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between h-9 border-b border-stone-50">
                <span className="text-[11px] uppercase tracking-wide text-stone-400">Sessions Completed</span>
                <span className="text-sm font-semibold text-stone-700">{todaySessions}</span>
            </div>

            <div className="flex items-center justify-between h-9 border-b border-stone-50">
                <span className="text-[11px] uppercase tracking-wide text-stone-400">Focus Time</span>
                <span className="text-sm font-semibold text-stone-700">
                    {todayFocusMinutes}<span className="text-[10px] text-stone-400 font-normal ml-0.5">min</span>
                </span>
            </div>

            <div className="flex items-center justify-between h-9 border-b border-stone-50">
                <span className="text-[11px] uppercase tracking-wide text-stone-400">Cycle Progress</span>
                <span className="text-sm font-semibold text-stone-700">
                    {sessionInCycle}<span className="text-[10px] text-stone-400 font-normal">/4</span>
                </span>
            </div>

            <div className="pt-3">
                <Progress value={cycleProgress} className="h-1.5 w-full bg-stone-100 [&>div]:bg-orange-500" />
            </div>
        </div>
    );
}
