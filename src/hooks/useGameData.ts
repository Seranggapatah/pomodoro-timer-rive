import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { GameData, Achievement } from "../types";

// ===== XP SYSTEM CONFIG =====
// XP yang didapat per sesi fokus (base)
const BASE_XP_PER_SESSION = 50;
// Bonus XP per menit fokus (misal 25 menit → +25 xp tambahan)
const XP_PER_MINUTE = 1;
// Bonus XP dari streak (per hari streak)
const XP_STREAK_BONUS = 5;
// Bonus XP saat complete task
const XP_PER_TASK = 20;

/**
 * Hitung XP yang dibutuhkan untuk naik dari level N ke N+1.
 * Formula makin tinggi level, makin banyak XP yang dibutuhkan.
 */
export function xpRequiredForLevel(level: number): number {
    return 100 + level * 50; // Level 0→1: 100xp, Level 1→2: 150xp, dst
}

/**
 * Hitung berapa XP didapat dari satu sesi fokus.
 */
export function calcSessionXp(focusMinutes: number, streak: number): number {
    const base = BASE_XP_PER_SESSION;
    const minuteBonus = focusMinutes * XP_PER_MINUTE;
    const streakBonus = streak * XP_STREAK_BONUS;
    return base + minuteBonus + streakBonus;
}

/**
 * Daftar achievement yang bisa diraih.
 */
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
};

/**
 * Proses XP: hitung apakah level naik, kembalikan state XP baru.
 */
function applyXpGain(
    currentXp: number,
    currentLevel: number,
    currentTotalXp: number,
    gainedXp: number
): { xp: number; level: number; totalXp: number; xpToNextLevel: number; levelsGained: number } {
    let xp = currentXp + gainedXp;
    let level = currentLevel;
    let levelsGained = 0;

    // Level-up loop (bisa naik beberapa level sekaligus)
    while (xp >= xpRequiredForLevel(level)) {
        xp -= xpRequiredForLevel(level);
        level += 1;
        levelsGained += 1;
    }

    return {
        xp,
        level,
        totalXp: currentTotalXp + gainedXp,
        xpToNextLevel: xpRequiredForLevel(level),
        levelsGained,
    };
}

/**
 * Hook untuk gamification: streak, level, achievements, dan XP.
 */
export function useGameData() {
    const [gameData, setGameData] = useLocalStorage<GameData>("pomodoro-game", DEFAULT_GAME);

    // Pastikan achievements list lengkap (kalau ada yang baru ditambahkan)
    const achievements = ACHIEVEMENT_DEFS.map((def) => {
        const existing = gameData.achievements.find((a) => a.id === def.id);
        return existing || { ...def, unlocked: false };
    });

    // Pastikan XP fields ada (backward compat untuk save lama)
    const safeXp = gameData.xp ?? 0;
    const safeTotalXp = gameData.totalXp ?? 0;
    const safeXpToNextLevel = gameData.xpToNextLevel ?? xpRequiredForLevel(gameData.level ?? 0);

    const recordGameSession = useCallback((focusMinutes: number = 25) => {
        const today = getTodayString();
        const yesterday = getYesterdayString();

        setGameData((prev) => {
            const newTotal = prev.totalSessions + 1;

            // Update streak
            let newStreak = prev.streak;
            if (prev.lastActiveDate === today) {
                newStreak = prev.streak;
            } else if (prev.lastActiveDate === yesterday) {
                newStreak = prev.streak + 1;
            } else {
                newStreak = 1;
            }

            // Hitung XP yang didapat sesi ini
            const gainedXp = calcSessionXp(focusMinutes, newStreak);

            // Apply XP & level-up
            const xpResult = applyXpGain(
                prev.xp ?? 0,
                prev.level,
                prev.totalXp ?? 0,
                gainedXp
            );

            const newLevel = xpResult.level;

            // Check achievements
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
                streak: newStreak,
                lastActiveDate: today,
                totalSessions: newTotal,
                totalTasksCompleted: prev.totalTasksCompleted || 0,
                level: newLevel,
                achievements: newAchievements,
                xp: xpResult.xp,
                totalXp: xpResult.totalXp,
                xpToNextLevel: xpResult.xpToNextLevel,
            };
        });
    }, [setGameData]);

    const recordTaskComplete = useCallback(() => {
        setGameData(prev => {
            const gainedXp = XP_PER_TASK;
            const xpResult = applyXpGain(
                prev.xp ?? 0,
                prev.level,
                prev.totalXp ?? 0,
                gainedXp
            );

            // Re-check level achievements
            const newLevel = xpResult.level;
            const newAchievements = prev.achievements.map(a => {
                if (a.unlocked) return a;
                if (a.id === "level_5" && newLevel >= 5) return { ...a, unlocked: true };
                if (a.id === "level_10" && newLevel >= 10) return { ...a, unlocked: true };
                return a;
            });

            return {
                ...prev,
                totalTasksCompleted: (prev.totalTasksCompleted || 0) + 1,
                level: newLevel,
                achievements: newAchievements,
                xp: xpResult.xp,
                totalXp: xpResult.totalXp,
                xpToNextLevel: xpResult.xpToNextLevel,
            };
        });
    }, [setGameData]);

    const xpPercent = safeXpToNextLevel > 0
        ? Math.min(100, Math.round((safeXp / safeXpToNextLevel) * 100))
        : 0;

    return {
        streak: gameData.streak,
        totalSessions: gameData.totalSessions,
        totalTasksCompleted: gameData.totalTasksCompleted || 0,
        level: gameData.level,
        achievements,
        recordGameSession,
        recordTaskComplete,
        // XP
        xp: safeXp,
        totalXp: safeTotalXp,
        xpToNextLevel: safeXpToNextLevel,
        xpPercent,
    };
}
