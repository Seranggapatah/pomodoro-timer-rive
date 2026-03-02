import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { DailyStats, HeatmapDay, TimelineLog } from "../types";

function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

function getDayLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

/**
 * Tentukan level heatmap (0-4) berdasarkan jumlah sesi & max sesi dalam periode.
 */
function calcLevel(sessions: number, max: number): 0 | 1 | 2 | 3 | 4 {
    if (sessions === 0 || max === 0) return 0;
    const ratio = sessions / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

const EMPTY_DAY: DailyStats = {
    date: "",
    sessions: 0,
    totalFocusMinutes: 0,
    completedTasks: 0,
    hourlyBreakdown: {},
};

/**
 * Hook untuk melacak statistik pomodoro:
 * - 90 hari terakhir (untuk heatmap)
 * - 7 hari terakhir (untuk weekly chart)
 * - distribusi per jam
 */
export function useStats() {
    // Simpan 90 hari terakhir untuk heatmap
    const [longData, setLongData] = useLocalStorage<DailyStats[]>("pomodoro-stats-long", []);
    // Simpan 7 hari terakhir untuk weekly chart (backward compat key)
    const [weeklyData, setWeeklyData] = useLocalStorage<DailyStats[]>("pomodoro-weekly", []);
    // Simpan timeline (histori maksimum 100 log)
    const [logs, setLogs] = useLocalStorage<TimelineLog[]>("pomodoro-logs", []);

    const today = getTodayString();
    const todayStats = weeklyData.find((d) => d.date === today) || { ...EMPTY_DAY, date: today };

    const recordSession = useCallback((focusMinutes: number) => {
        const today = getTodayString();
        const currentHour = new Date().getHours();

        const updateEntry = (prev: DailyStats[], maxEntries: number): DailyStats[] => {
            const existing = prev.find((d) => d.date === today);
            let updated: DailyStats[];
            if (existing) {
                updated = prev.map((d) => {
                    if (d.date !== today) return d;
                    const hb = { ...(d.hourlyBreakdown ?? {}) };
                    hb[currentHour] = (hb[currentHour] ?? 0) + 1;
                    return {
                        ...d,
                        sessions: d.sessions + 1,
                        totalFocusMinutes: d.totalFocusMinutes + focusMinutes,
                        hourlyBreakdown: hb,
                    };
                });
            } else {
                const hb: Record<number, number> = { [currentHour]: 1 };
                updated = [
                    ...prev,
                    {
                        date: today,
                        sessions: 1,
                        totalFocusMinutes: focusMinutes,
                        completedTasks: 0,
                        hourlyBreakdown: hb,
                    },
                ];
            }
            return updated.slice(-maxEntries);
        };

        setLongData((prev) => updateEntry(prev, 90));
        setWeeklyData((prev) => updateEntry(prev, 7));
    }, [setLongData, setWeeklyData]);

    const recordTaskComplete = useCallback(() => {
        const today = getTodayString();

        const updateEntry = (prev: DailyStats[], maxEntries: number): DailyStats[] => {
            const existing = prev.find((d) => d.date === today);
            let updated: DailyStats[];
            if (existing) {
                updated = prev.map((d) =>
                    d.date === today ? { ...d, completedTasks: (d.completedTasks || 0) + 1 } : d
                );
            } else {
                updated = [
                    ...prev,
                    { date: today, sessions: 0, totalFocusMinutes: 0, completedTasks: 1 },
                ];
            }
            return updated.slice(-maxEntries);
        };

        setLongData((prev) => updateEntry(prev, 90));
        setWeeklyData((prev) => updateEntry(prev, 7));
    }, [setLongData, setWeeklyData]);

    // ── Fungsi Record Timeline Log ──
    const recordTimelineLog = useCallback((type: "focus" | "break", durationMinutes: number, taskName?: string) => {
        setLogs(prev => {
            const newLog: TimelineLog = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                type,
                durationMinutes,
                taskName
            };
            // Limit keeping only last 100 items for perfomance
            return [newLog, ...prev].slice(0, 100);
        });
    }, [setLogs]);

    // ── 7 days untuk weekly bar chart ──
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
            hourlyBreakdown: found?.hourlyBreakdown,
            dayLabel: getDayLabel(dateStr),
        });
    }

    // ── Heatmap 90 hari ──
    const maxSessions90 = Math.max(...longData.map((d) => d.sessions), 1);
    const heatmap90: HeatmapDay[] = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const found = longData.find((l) => l.date === dateStr);
        const sessions = found?.sessions ?? 0;
        heatmap90.push({
            date: dateStr,
            sessions,
            level: calcLevel(sessions, maxSessions90),
        });
    }

    // ── Produktivitas per jam (gabungan 7 hari terakhir) ──
    const hourlyProductivity: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyProductivity[h] = 0;
    weeklyData.forEach((day) => {
        if (!day.hourlyBreakdown) return;
        Object.entries(day.hourlyBreakdown).forEach(([h, count]) => {
            hourlyProductivity[parseInt(h)] = (hourlyProductivity[parseInt(h)] ?? 0) + count;
        });
    });

    return {
        todaySessions: todayStats.sessions,
        todayFocusMinutes: todayStats.totalFocusMinutes,
        todayCompletedTasks: todayStats.completedTasks,
        last7Days,
        heatmap90,
        hourlyProductivity,
        logs,
        recordSession,
        recordTaskComplete,
        recordTimelineLog,
    };
}
