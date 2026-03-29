import { useState } from "react";
import { BarChart2 } from "lucide-react";
import { StatsDisplay } from "./StatsDisplay";
import { WeeklyDashboard } from "./WeeklyDashboard";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { HourlyChart } from "./HourlyChart";
import type { HeatmapDay, DailyStats } from "../types";

type StatsTab = "today" | "weekly" | "heatmap" | "hourly";

interface MergedStatsCardProps {
    todaySessions: number;
    todayFocusMinutes: number;
    sessionInCycle: number;
    last7Days: (DailyStats & { dayLabel: string })[];
    heatmap90: HeatmapDay[];
    hourlyProductivity: Record<number, number>;
}

const TABS: { id: StatsTab; label: string }[] = [
    { id: "today", label: "TODAY" },
    { id: "weekly", label: "WEEKLY" },
    { id: "heatmap", label: "HEATMAP" },
    { id: "hourly", label: "HOURLY" },
];

export function MergedStatsCard({
    todaySessions, todayFocusMinutes, sessionInCycle,
    last7Days, heatmap90, hourlyProductivity,
}: MergedStatsCardProps) {
    const [tab, setTab] = useState<StatsTab>("today");

    return (
        <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-orange-400" />
                    <span className="card-title">STATISTICS</span>
                </div>
            </div>

            <div className="border-t border-stone-100 mb-3" />

            {/* Tab bar */}
            <div className="flex border-b border-stone-100 mb-4 overflow-x-auto min-w-0 hide-scrollbar scroll-smooth">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-3 py-2 cursor-pointer transition-colors whitespace-nowrap ${
                            tab === t.id
                                ? "tab-active"
                                : "tab-inactive hover:text-stone-600"
                        }`}
                    >
                        {t.id === "today" ? "TODAY" : t.id.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="mt-3 min-h-[200px]">
                {tab === "today" && (
                    <StatsDisplay
                        todaySessions={todaySessions}
                        todayFocusMinutes={todayFocusMinutes}
                        sessionInCycle={sessionInCycle}
                    />
                )}
                {tab === "weekly" && (
                    <WeeklyDashboard last7Days={last7Days} />
                )}
                {tab === "heatmap" && (
                    <ActivityHeatmap days={heatmap90} />
                )}
                {tab === "hourly" && (
                    <HourlyChart hourlyData={hourlyProductivity} />
                )}
            </div>
        </div>
    );
}
