import type { HeatmapDay } from "../types";

interface ActivityHeatmapProps {
    days: HeatmapDay[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * GitHub-style 90-hari activity heatmap.
 * Menampilkan dalam grid week-columns × day-rows.
 */
export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
    const totalSessions = days.reduce((s, d) => s + d.sessions, 0);
    const activeDays = days.filter(d => d.sessions > 0).length;

    // Tentukan hari pertama minggu dari awal heatmap
    // Pad awal agar kolom pertama dimulai dari hari yg benar
    const firstDate = days[0]?.date;
    const firstDow = firstDate
        ? new Date(firstDate + "T00:00:00").getDay() // 0=Sun
        : 0;

    // Buat array dengan padding kosong di depan
    const padded: (HeatmapDay | null)[] = [
        ...Array(firstDow).fill(null),
        ...days,
    ];

    // Split jadi minggu (kolom)
    const weeks: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
        weeks.push(padded.slice(i, i + 7));
    }

    // Ambil label bulan: tandai kolom pertama dari setiap bulan baru
    const monthLabels: string[] = weeks.map((week) => {
        for (const day of week) {
            if (!day) continue;
            const d = new Date(day.date + "T00:00:00");
            if (d.getDate() <= 7) return MONTH_NAMES[d.getMonth()];
        }
        return "";
    });

    const todayStr = new Date().toISOString().split("T")[0];

    return (
        <div className="activity-heatmap">
            <div className="heatmap-title">&gt; activity_heatmap</div>

            <div className="heatmap-body">
                {/* Label hari di kiri */}
                <div className="heatmap-day-labels">
                    {DAY_LABELS.map((d, i) => (
                        <span key={i} className="heatmap-day-label">{i % 2 === 1 ? d : ""}</span>
                    ))}
                </div>

                {/* Grid cells */}
                <div className="heatmap-grid-wrapper">
                    {/* Label bulan di atas */}
                    <div className="heatmap-month-row">
                        {monthLabels.map((label, i) => (
                            <span key={i} className="heatmap-month-label">{label}</span>
                        ))}
                    </div>

                    {/* Kolom per minggu */}
                    <div className="heatmap-grid">
                        {weeks.map((week, wi) => (
                            <div key={wi} className="heatmap-week">
                                {Array.from({ length: 7 }, (_, di) => {
                                    const cell = week[di];
                                    if (!cell) {
                                        return <div key={di} className="heatmap-cell empty" />;
                                    }
                                    const isToday = cell.date === todayStr;
                                    return (
                                        <div
                                            key={di}
                                            className={`heatmap-cell level-${cell.level} ${isToday ? "today" : ""}`}
                                            title={`${cell.date}: ${cell.sessions} session${cell.sessions !== 1 ? "s" : ""}`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap-footer">
                <span className="heatmap-summary">{activeDays} days · {totalSessions} sessions</span>
                <div className="heatmap-legend">
                    <span className="heatmap-legend-label">less</span>
                    {[0, 1, 2, 3, 4].map(l => (
                        <div key={l} className={`heatmap-cell level-${l}`} />
                    ))}
                    <span className="heatmap-legend-label">more</span>
                </div>
            </div>
        </div>
    );
}
