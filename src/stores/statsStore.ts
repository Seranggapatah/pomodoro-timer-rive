import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailyStats, HeatmapDay, TimelineLog } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

function getDayLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

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

// ---------------------------------------------------------------------------
// Raw store (internal)
// ---------------------------------------------------------------------------
interface StatsRawState {
    longData: DailyStats[];
    weeklyData: DailyStats[];
    logs: TimelineLog[];

    recordSession: (focusMinutes: number) => void;
    recordTaskComplete: () => void;
    recordTimelineLog: (
        type: "focus" | "break",
        durationMinutes: number,
        taskName?: string
    ) => void;
}

export const useStatsStore = create<StatsRawState>()(
    persist(
        (set) => ({
            longData: readLS<DailyStats[]>("pomodoro-stats-long", []),
            weeklyData: readLS<DailyStats[]>("pomodoro-weekly", []),
            logs: readLS<TimelineLog[]>("pomodoro-logs", []),

            recordSession: (focusMinutes) => {
                const today = getTodayString();
                const currentHour = new Date().getHours();

                const updateEntry = (
                    prev: DailyStats[],
                    maxEntries: number
                ): DailyStats[] => {
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
                                totalFocusMinutes:
                                    d.totalFocusMinutes + focusMinutes,
                                hourlyBreakdown: hb,
                            };
                        });
                    } else {
                        updated = [
                            ...prev,
                            {
                                date: today,
                                sessions: 1,
                                totalFocusMinutes: focusMinutes,
                                completedTasks: 0,
                                hourlyBreakdown: { [currentHour]: 1 },
                            },
                        ];
                    }
                    return updated.slice(-maxEntries);
                };

                set((s) => ({
                    longData: updateEntry(s.longData, 90),
                    weeklyData: updateEntry(s.weeklyData, 7),
                }));
            },

            recordTaskComplete: () => {
                const today = getTodayString();

                const updateEntry = (
                    prev: DailyStats[],
                    maxEntries: number
                ): DailyStats[] => {
                    const existing = prev.find((d) => d.date === today);
                    let updated: DailyStats[];
                    if (existing) {
                        updated = prev.map((d) =>
                            d.date === today
                                ? {
                                      ...d,
                                      completedTasks:
                                          (d.completedTasks || 0) + 1,
                                  }
                                : d
                        );
                    } else {
                        updated = [
                            ...prev,
                            {
                                date: today,
                                sessions: 0,
                                totalFocusMinutes: 0,
                                completedTasks: 1,
                            },
                        ];
                    }
                    return updated.slice(-maxEntries);
                };

                set((s) => ({
                    longData: updateEntry(s.longData, 90),
                    weeklyData: updateEntry(s.weeklyData, 7),
                }));
            },

            recordTimelineLog: (type, durationMinutes, taskName) => {
                set((s) => ({
                    logs: [
                        {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            type,
                            durationMinutes,
                            taskName,
                        },
                        ...s.logs,
                    ].slice(0, 100),
                }));
            },
        }),
        { name: "pomodoro-stats-store" }
    )
);

// ---------------------------------------------------------------------------
// Wrapper hook — adds computed / derived values (backward compat)
// ---------------------------------------------------------------------------
export function useStats() {
    const store = useStatsStore();
    const { longData, weeklyData, logs } = store;

    return useMemo(() => {
        const today = getTodayString();
        const todayStats =
            weeklyData.find((d) => d.date === today) || {
                ...EMPTY_DAY,
                date: today,
            };

        // 7-day bar chart
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

        // 90-day heatmap
        const maxSessions90 = Math.max(
            ...longData.map((d) => d.sessions),
            1
        );
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

        // Hourly productivity
        const hourlyProductivity: Record<number, number> = {};
        for (let h = 0; h < 24; h++) hourlyProductivity[h] = 0;
        weeklyData.forEach((day) => {
            if (!day.hourlyBreakdown) return;
            Object.entries(day.hourlyBreakdown).forEach(([h, count]) => {
                hourlyProductivity[parseInt(h)] =
                    (hourlyProductivity[parseInt(h)] ?? 0) + count;
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
            recordSession: store.recordSession,
            recordTaskComplete: store.recordTaskComplete,
            recordTimelineLog: store.recordTimelineLog,
        };
    }, [longData, weeklyData, logs, store.recordSession, store.recordTaskComplete, store.recordTimelineLog]);
}
