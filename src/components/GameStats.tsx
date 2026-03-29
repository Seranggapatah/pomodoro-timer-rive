import type { Achievement } from "../types";
import { Star, Flame, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface GameStatsProps {
    streak: number;
    totalSessions: number;
    totalTasksCompleted: number;
    level: number;
    achievements: Achievement[];
}

export function GameStats({ streak, totalSessions, totalTasksCompleted, level, achievements }: GameStatsProps) {
    const [showAllAchievements, setShowAllAchievements] = useState(false);
    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return (
        <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white w-full overflow-hidden shrink-0">
            <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-orange-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">PLAYER STATS</span>
                </div>
            </div>
            
            <Separator className="my-0" />

            <div className="grid grid-cols-2 gap-2 mt-3 w-full">
                <div className="flex flex-col bg-stone-50 p-2.5 rounded-lg border border-stone-200/50 items-center justify-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold flex items-center gap-1 w-full justify-center shrink-0">
                        <Star size={10} className="text-yellow-500" /> LEVEL
                    </span>
                    <span className="text-xl font-bold text-stone-800 font-mono leading-tight mt-1">{level}</span>
                </div>
                <div className="flex flex-col bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/20 items-center justify-center text-center">
                    <span className="text-[10px] uppercase tracking-widest text-orange-600 font-semibold flex items-center gap-1 w-full justify-center shrink-0">
                        <Flame size={10} className="text-orange-500" /> STREAK
                    </span>
                    <span className="text-xl font-bold text-orange-600 font-mono leading-tight mt-1">
                        {streak} <span className="text-[9px] font-normal tracking-widest uppercase ml-0.5 font-sans">Day{streak !== 1 ? 's' : ''}</span>
                    </span>
                </div>
            </div>

            <Separator className="my-1" />

            <div className="grid grid-cols-2 gap-2 pt-1 w-full">
                <div className="flex flex-col p-1 overflow-hidden">
                    <span className="text-[9px] text-stone-400 uppercase tracking-[0.15em] font-medium truncate w-full">TOTAL FOCUS</span>
                    <span className="text-sm font-bold text-stone-800 font-mono mt-1 truncate w-full leading-none">
                        {totalSessions} <span className="text-[9px] text-stone-400 font-normal font-sans">SESSIONS</span>
                    </span>
                </div>
                <div className="flex flex-col p-1 overflow-hidden items-start sm:items-end sm:text-right">
                    <span className="text-[9px] text-stone-400 uppercase tracking-[0.15em] font-medium truncate w-full">TASKS SOLVED</span>
                    <span className="text-sm font-bold text-stone-800 font-mono mt-1 truncate w-full leading-none">{totalTasksCompleted}</span>
                </div>
            </div>

            <Separator className="my-1" />

            {/* Achievements */}
            <div className="flex flex-col gap-2 pt-1 relative w-full">
                <div className="text-[9px] uppercase tracking-[0.15em] text-stone-400 font-semibold mb-1 flex items-center justify-between">
                    <span>ACHIEVEMENTS ({unlockedCount}/{achievements.length})</span>
                    <button 
                         className="text-[9px] text-stone-400 hover:text-stone-700 hover:underline uppercase tracking-widest font-semibold flex items-center cursor-pointer transition-colors"
                         onClick={() => setShowAllAchievements(!showAllAchievements)}
                    >
                         {showAllAchievements ? 'Hide' : `Show All`}
                         {showAllAchievements ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>
                    <div className={`flex flex-wrap gap-1.5 transition-all duration-300 ease-in-out ${showAllAchievements ? 'max-h-[500px] overflow-visible pb-2' : 'max-h-[44px] overflow-hidden'}`}>
                        {achievements.map((a) => (
                            <span
                                key={a.id}
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all shrink-0 ${
                                    a.unlocked 
                                      ? "bg-orange-500 border border-orange-500 text-white shadow-sm" 
                                      : "bg-transparent border border-dashed border-stone-200 text-stone-400 opacity-50"
                                }`}
                                title={a.description}
                            >
                                {a.name}
                            </span>
                        ))}
                    </div>
            </div>
        </div>
    );
}
