import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { GameData, Achievement } from "../types";

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
    level: 0,
    achievements: ACHIEVEMENT_DEFS.map((a) => ({ ...a, unlocked: false })),
};

/**
 * Hook untuk gamification: streak, level, achievements.
 */
export function useGameData() {
    const [gameData, setGameData] = useLocalStorage<GameData>("pomodoro-game", DEFAULT_GAME);

    // Pastikan achievements list lengkap (kalau ada yang baru ditambahkan)
    const achievements = ACHIEVEMENT_DEFS.map((def) => {
        const existing = gameData.achievements.find((a) => a.id === def.id);
        return existing || { ...def, unlocked: false };
    });

    const recordGameSession = useCallback(() => {
        const today = getTodayString();
        const yesterday = getYesterdayString();

        setGameData((prev) => {
            const newTotal = prev.totalSessions + 1;
            const newLevel = Math.floor(newTotal / 10);

            // Update streak
            let newStreak = prev.streak;
            if (prev.lastActiveDate === today) {
                // Sudah record hari ini, streak tetap
                newStreak = prev.streak;
            } else if (prev.lastActiveDate === yesterday) {
                // Hari berturut-turut
                newStreak = prev.streak + 1;
            } else {
                // Streak reset
                newStreak = 1;
            }

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
                level: newLevel,
                achievements: newAchievements,
            };
        });
    }, [setGameData]);

    return {
        streak: gameData.streak,
        totalSessions: gameData.totalSessions,
        level: gameData.level,
        achievements,
        recordGameSession,
    };
}
