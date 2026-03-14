import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameData, Achievement } from "../types";

// ===== XP SYSTEM CONFIG =====
const BASE_XP_PER_SESSION = 50;
const XP_PER_MINUTE = 1;
const XP_STREAK_BONUS = 5;
const XP_PER_TASK = 20;

export function xpRequiredForLevel(level: number): number {
    return 100 + level * 50;
}

export function calcSessionXp(focusMinutes: number, streak: number): number {
    return BASE_XP_PER_SESSION + focusMinutes * XP_PER_MINUTE + streak * XP_STREAK_BONUS;
}

// ---------------------------------------------------------------------------
const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked">[] = [
    { id: "first_focus", name: "First Focus", description: "Selesaikan sesi pertama" },
    { id: "five_sessions", name: "Getting Started", description: "Selesaikan 5 sesi" },
    { id: "ten_sessions", name: "Dedicated", description: "Selesaikan 10 sesi" },
    { id: "twenty_five", name: "Quarter Century", description: "Selesaikan 25 sesi" },
    { id: "fifty_sessions", name: "Half Century", description: "Selesaikan 50 sesi" },
    { id: "hundred", name: "Centurion", description: "Selesaikan 100 sesi" },
    { id: "streak_3", name: "On Fire", description: "3 hari berturut-turut" },
    { id: "streak_7", name: "Week Warrior", description: "7 hari berturut-turut" },
    { id: "streak_14", name: "Unstoppable", description: "14 hari berturut-turut" },
    { id: "streak_30", name: "Monthly Master", description: "30 hari berturut-turut" },
    { id: "level_5", name: "Rising Star", description: "Capai level 5" },
    { id: "level_10", name: "Pro Timer", description: "Capai level 10" },
];

function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}
function getYesterdayString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}

function applyXpGain(
    currentXp: number,
    currentLevel: number,
    currentTotalXp: number,
    gainedXp: number
) {
    let xp = currentXp + gainedXp;
    let level = currentLevel;
    let levelsGained = 0;
    while (xp >= xpRequiredForLevel(level)) {
        xp -= xpRequiredForLevel(level);
        level += 1;
        levelsGained += 1;
    }
    return { xp, level, totalXp: currentTotalXp + gainedXp, xpToNextLevel: xpRequiredForLevel(level), levelsGained };
}

const DEFAULT_GAME: GameData = {
    streak: 0,
    lastActiveDate: "",
    totalSessions: 0,
    totalTasksCompleted: 0,
    level: 0,
    achievements: ACHIEVEMENT_DEFS.map((a) => ({ ...a, unlocked: false })),
    xp: 0,
    totalXp: 0,
    xpToNextLevel: xpRequiredForLevel(0),
    flappyDroidScore: 0,
};

// ---------------------------------------------------------------------------
function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

// ---------------------------------------------------------------------------
interface GameState {
    data: GameData;
    recordGameSession: (focusMinutes?: number) => void;
    recordTaskComplete: () => void;
    updateFlappyScore: (score: number) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set) => ({
            data: readLS<GameData>("pomodoro-game", DEFAULT_GAME),

            recordGameSession: (focusMinutes = 25) => {
                const today = getTodayString();
                const yesterday = getYesterdayString();

                set((s) => {
                    const prev = s.data;
                    const newTotal = prev.totalSessions + 1;

                    let newStreak = prev.streak;
                    if (prev.lastActiveDate === today) {
                        newStreak = prev.streak;
                    } else if (prev.lastActiveDate === yesterday) {
                        newStreak = prev.streak + 1;
                    } else {
                        newStreak = 1;
                    }

                    const gainedXp = calcSessionXp(focusMinutes, newStreak);
                    const xpResult = applyXpGain(prev.xp ?? 0, prev.level, prev.totalXp ?? 0, gainedXp);
                    const newLevel = xpResult.level;

                    const newAchievements = ACHIEVEMENT_DEFS.map((def) => {
                        const wasUnlocked = prev.achievements.find((a) => a.id === def.id)?.unlocked || false;
                        if (wasUnlocked) return { ...def, unlocked: true };
                        let unlocked = false;
                        switch (def.id) {
                            case "first_focus": unlocked = newTotal >= 1; break;
                            case "five_sessions": unlocked = newTotal >= 5; break;
                            case "ten_sessions": unlocked = newTotal >= 10; break;
                            case "twenty_five": unlocked = newTotal >= 25; break;
                            case "fifty_sessions": unlocked = newTotal >= 50; break;
                            case "hundred": unlocked = newTotal >= 100; break;
                            case "streak_3": unlocked = newStreak >= 3; break;
                            case "streak_7": unlocked = newStreak >= 7; break;
                            case "streak_14": unlocked = newStreak >= 14; break;
                            case "streak_30": unlocked = newStreak >= 30; break;
                            case "level_5": unlocked = newLevel >= 5; break;
                            case "level_10": unlocked = newLevel >= 10; break;
                        }
                        return { ...def, unlocked };
                    });

                    return {
                        data: {
                            streak: newStreak,
                            lastActiveDate: today,
                            totalSessions: newTotal,
                            totalTasksCompleted: prev.totalTasksCompleted || 0,
                            level: newLevel,
                            achievements: newAchievements,
                            xp: xpResult.xp,
                            totalXp: xpResult.totalXp,
                            xpToNextLevel: xpResult.xpToNextLevel,
                        },
                    };
                });
            },

            recordTaskComplete: () => {
                set((s) => {
                    const prev = s.data;
                    const gainedXp = XP_PER_TASK;
                    const xpResult = applyXpGain(prev.xp ?? 0, prev.level, prev.totalXp ?? 0, gainedXp);
                    const newLevel = xpResult.level;

                    const newAchievements = prev.achievements.map((a) => {
                        if (a.unlocked) return a;
                        if (a.id === "level_5" && newLevel >= 5) return { ...a, unlocked: true };
                        if (a.id === "level_10" && newLevel >= 10) return { ...a, unlocked: true };
                        return a;
                    });

                    return {
                        data: {
                            ...prev,
                            totalTasksCompleted: (prev.totalTasksCompleted || 0) + 1,
                            level: newLevel,
                            achievements: newAchievements,
                            xp: xpResult.xp,
                            totalXp: xpResult.totalXp,
                            xpToNextLevel: xpResult.xpToNextLevel,
                        },
                    };
                });
            },

            updateFlappyScore: (score: number) => {
                set((s) => {
                    const prev = s.data;
                    const prevScore = prev.flappyDroidScore || 0;
                    if (score > prevScore) {
                        return {
                            data: {
                                ...prev,
                                flappyDroidScore: score,
                            },
                        };
                    }
                    return {};
                });
            },
        }),
        { name: "pomodoro-game-store" }
    )
);

// ---------------------------------------------------------------------------
// Wrapper hook — flattens data + adds xpPercent (backward compat)
// ---------------------------------------------------------------------------
export function useGame() {
    const { data, recordGameSession, recordTaskComplete, updateFlappyScore } = useGameStore();

    return useMemo(() => {
        const achievements = ACHIEVEMENT_DEFS.map((def) => {
            const existing = data.achievements.find((a) => a.id === def.id);
            return existing || { ...def, unlocked: false };
        });

        const safeXp = data.xp ?? 0;
        const safeTotalXp = data.totalXp ?? 0;
        const safeXpToNextLevel = data.xpToNextLevel ?? xpRequiredForLevel(data.level ?? 0);
        const xpPercent = safeXpToNextLevel > 0
            ? Math.min(100, Math.round((safeXp / safeXpToNextLevel) * 100))
            : 0;

        return {
            streak: data.streak,
            totalSessions: data.totalSessions,
            totalTasksCompleted: data.totalTasksCompleted || 0,
            level: data.level,
            achievements,
            recordGameSession,
            recordTaskComplete,
            updateFlappyScore,
            xp: safeXp,
            totalXp: safeTotalXp,
            xpToNextLevel: safeXpToNextLevel,
            xpPercent,
            flappyDroidScore: data.flappyDroidScore || 0,
        };
    }, [data, recordGameSession, recordTaskComplete, updateFlappyScore]);
}
