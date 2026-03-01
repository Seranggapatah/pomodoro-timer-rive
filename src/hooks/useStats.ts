import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { DailyStats } from "../types";

/**
 * Helper: tanggal hari ini dalam format "YYYY-MM-DD"
 */
function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

/** Nama hari singkat */
function getDayLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

const EMPTY_DAY: DailyStats = { date: "", sessions: 0, totalFocusMinutes: 0, completedTasks: 0 };

/**
 * Hook untuk melacak statistik pomodoro harian + mingguan.
 * Menyimpan data 7 hari terakhir di localStorage.
 */
export function useStats() {
    const [weeklyData, setWeeklyData] = useLocalStorage<DailyStats[]>("pomodoro-weekly", []);

    const today = getTodayString();

    // Ambil data hari ini dari weekly array
    const todayStats = weeklyData.find((d) => d.date === today) || { ...EMPTY_DAY, date: today };

    const recordSession = useCallback((focusMinutes: number) => {
        const today = getTodayString();
        setWeeklyData((prev) => {
            // Update atau tambah entry untuk hari ini
            const existing = prev.find((d) => d.date === today);
            let updated: DailyStats[];
            if (existing) {
                updated = prev.map((d) =>
                    d.date === today
                        ? { ...d, sessions: d.sessions + 1, totalFocusMinutes: d.totalFocusMinutes + focusMinutes }
                        : d
                );
            } else {
                updated = [...prev, { date: today, sessions: 1, totalFocusMinutes: focusMinutes, completedTasks: 0 }];
            }
            // Hanya simpan 7 hari terakhir
            return updated.slice(-7);
        });
    }, [setWeeklyData]);

    const recordTaskComplete = useCallback(() => {
        const today = getTodayString();
        setWeeklyData((prev) => {
            const existing = prev.find((d) => d.date === today);
            let updated: DailyStats[];
            if (existing) {
                updated = prev.map((d) =>
                    d.date === today ? { ...d, completedTasks: (d.completedTasks || 0) + 1 } : d
                );
            } else {
                updated = [...prev, { date: today, sessions: 0, totalFocusMinutes: 0, completedTasks: 1 }];
            }
            return updated.slice(-7);
        });
    }, [setWeeklyData]);

    // Buat array 7 hari terakhir (isi 0 untuk hari tanpa data)
    const last7Days: (DailyStats & { dayLabel: string })[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const found = weeklyData.find((w) => w.date === dateStr);
        last7Days.push({
            date: dateStr,
            sessions: found?.sessions || 0,
            totalFocusMinutes: found?.totalFocusMinutes || 0,
            completedTasks: found?.completedTasks || 0,
            dayLabel: getDayLabel(dateStr),
        });
    }

    return {
        todaySessions: todayStats.sessions,
        todayFocusMinutes: todayStats.totalFocusMinutes,
        todayCompletedTasks: todayStats.completedTasks,
        last7Days,
        recordSession,
        recordTaskComplete,
    };
}
