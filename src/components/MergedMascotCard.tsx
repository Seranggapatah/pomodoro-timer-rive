import { useState } from "react";
import { Sparkles, Flame, Star, Timer } from "lucide-react";

import { RiveCharacter } from "./RiveCharacter";
import type { RiveMood, Achievement, Mode } from "../types";

interface MergedMascotCardProps {
    isActive: boolean;
    mode: Mode;
    mood: RiveMood;
    xpPercent: number;
    xp: number;
    xpToNextLevel: number;
    level: number;
    totalXp: number;
    streak: number;
    totalSessions: number;
    achievements: Achievement[];
    ascii?: any;
}

export function MergedMascotCard({
    isActive, mode, mood, xpPercent, xp, xpToNextLevel,
    level, totalXp, streak, totalSessions, achievements, ascii
}: MergedMascotCardProps) {
    const [showAllAchievements, setShowAllAchievements] = useState(false);
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white w-full relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-orange-400" />
                    <span className="card-title">MASCOT & PROGRESS</span>
                </div>
            </div>

            <div className="border-t border-stone-100 mb-3" />

            {/* Mascot Container: fix crop */}
            <div className="w-full mt-3 flex items-center justify-center" style={{ minHeight: 180, position: 'relative' }}>
                <div style={{ width: '100%', height: 180 }}>
                    <RiveCharacter
                        isActive={isActive}
                        isExpanded={true}
                        mode={mode}
                        mood={mood}
                        xpPercent={xpPercent}
                        ascii={ascii}
                    />
                </div>
            </div>

            {/* Level badge + XP bar inline */}
            <div className="mb-2 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                    <span className="card-label">LEVEL {level}</span>
                    <span className="text-[10px] text-stone-400 font-mono tracking-tight">{xp}/{xpToNextLevel} XP · {xpPercent.toFixed(0)}% to next</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden mt-1 mb-2">
                    <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${xpPercent}%` }}
                    />
                </div>
            </div>

            {/* Stat Row */}
            <div className="flex flex-col border-t border-b border-stone-100 my-3 py-3">
                <div className="flex items-center justify-around">
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-400" />
                            <span className="text-[9px] uppercase tracking-[0.12em] text-stone-400 font-medium">STREAK</span>
                        </div>
                        <span className="text-2xl font-bold text-stone-800 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                            {streak}
                        </span>
                        <span className="text-[9px] text-stone-400">days</span>
                    </div>

                    <div className="w-px h-8 bg-stone-100" />

                    <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                            <Star size={12} className="text-orange-400" />
                            <span className="text-[9px] uppercase tracking-[0.12em] text-stone-400 font-medium">LEVEL</span>
                        </div>
                        <span className="text-2xl font-bold text-stone-800 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                            {level}
                        </span>
                        <span className="text-[9px] text-stone-400">level</span>
                    </div>

                    <div className="w-px h-8 bg-stone-100" />

                    <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                            <Timer size={12} className="text-orange-400" />
                            <span className="text-[9px] uppercase tracking-[0.12em] text-stone-400 font-medium">SESSIONS</span>
                        </div>
                        <span className="text-2xl font-bold text-stone-800 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                            {totalSessions}
                        </span>
                        <span className="text-[9px] text-stone-400">total</span>
                    </div>
                </div>

                <p className="text-center text-[10px] text-stone-400 mt-2">{totalXp.toLocaleString()} lifetime XP</p>
            </div>

            {/* Achievement badges */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">ACHIEVEMENTS</span>
                        <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            {unlockedCount} / {achievements.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAllAchievements(!showAllAchievements)}
                        className="text-[10px] text-orange-400 font-medium hover:text-orange-500 transition-colors"
                    >
                        {showAllAchievements ? "COLLAPSE" : "SHOW ALL"}
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                    {(() => {
                        const COLLAPSED_LIMIT = 4;
                        const visibleBadges = showAllAchievements ? achievements : achievements.slice(0, COLLAPSED_LIMIT);
                        const hiddenCount = achievements.length - COLLAPSED_LIMIT;

                        return (
                            <>
                                {visibleBadges.map((a) => (
                                    <span
                                        key={a.id}
                                        title={a.description}
                                        className={`px-2 py-0.5 text-[10px] rounded-md font-medium shrink-0 ${
                                            a.unlocked
                                                ? "text-orange-700 bg-orange-50 border border-orange-200"
                                                : "bg-stone-50 text-stone-400 border border-dashed border-stone-200 opacity-40"
                                        }`}
                                    >
                                        {a.name}
                                    </span>
                                ))}

                                {!showAllAchievements && hiddenCount > 0 && (
                                    <button
                                        onClick={() => setShowAllAchievements(true)}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-400 font-medium hover:bg-orange-50 hover:text-orange-500 transition-colors"
                                    >
                                        +{hiddenCount} more
                                    </button>
                                )}

                                {showAllAchievements && (
                                    <button
                                        onClick={() => setShowAllAchievements(false)}
                                        className="text-[10px] text-orange-400 font-medium mt-1 w-full text-right"
                                    >
                                        COLLAPSE
                                    </button>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
