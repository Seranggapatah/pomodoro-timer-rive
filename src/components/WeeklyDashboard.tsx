import type { DailyStats } from "../types";

interface WeeklyDashboardProps {
    last7Days: (DailyStats & { dayLabel: string })[];
}

/**
 * Terminal-style bar chart displaying the last 7 days of pomodoro sessions.
 */
export function WeeklyDashboard({ last7Days }: WeeklyDashboardProps) {
    const totalSessions = last7Days.reduce((sum, d) => sum + d.sessions, 0);
    const totalMinutes = last7Days.reduce((sum, d) => sum + d.totalFocusMinutes, 0);
    const totalTasks = last7Days.reduce((sum, d) => sum + (d.completedTasks || 0), 0);
    const maxSessions = Math.max(...last7Days.map((d) => d.sessions), 1);

    return (
        <div className="weekly-dashboard">
            <div className="dashboard-title">&gt; weekly_report</div>

            <div className="dashboard-chart">
                {last7Days.map((day) => {
                    const heightPercent = (day.sessions / maxSessions) * 100;
                    const isToday = day.date === new Date().toISOString().split("T")[0];
                    const isEmpty = day.sessions === 0;

                    return (
                        <div key={day.date} className="dashboard-col">
                            <span className="dashboard-count">{day.sessions || ""}</span>
                            <div className="dashboard-bar-wrap">
                                <div
                                    className={`dashboard-bar ${isToday ? "today" : ""} ${isEmpty ? "empty" : ""}`}
                                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                />
                            </div>
                            <span className={`dashboard-day ${isToday ? "today" : ""}`}>
                                {day.dayLabel}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-summary">
                <span className="dashboard-total">
                    total: {totalSessions} sessions · {totalMinutes} min · {totalTasks} tasks
                </span>
            </div>
        </div>
    );
}
