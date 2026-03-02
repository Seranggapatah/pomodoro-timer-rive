interface HourlyChartProps {
    /** key = jam (0-23), value = total sesi dalam 7 hari terakhir */
    hourlyData: Record<number, number>;
}

/** Format jam ke label singkat */
function formatHour(h: number): string {
    if (h === 0) return "12a";
    if (h === 12) return "12p";
    return h < 12 ? `${h}a` : `${h - 12}p`;
}

/**
 * Bar chart produktivitas per jam (24 jam, data 7 hari gabungan).
 * Hanya tampilkan label jam tertentu agar tidak crowded.
 */
export function HourlyChart({ hourlyData }: HourlyChartProps) {
    const hours = Array.from({ length: 24 }, (_, h) => h);
    const values = hours.map(h => hourlyData[h] ?? 0);
    const maxVal = Math.max(...values, 1);
    const totalSessions = values.reduce((a, b) => a + b, 0);

    // Cari jam paling produktif
    const peakHour = values.indexOf(Math.max(...values));
    const peakLabel = maxVal > 0 ? formatHour(peakHour) : "-";

    // Label jam yang ditampilkan
    const SHOW_LABELS = new Set([0, 3, 6, 9, 12, 15, 18, 21, 23]);

    if (totalSessions === 0) {
        return (
            <div className="hourly-chart">
                <div className="hourly-title">&gt; hourly_productivity</div>
                <div className="dashboard-empty">
                    <div className="dashboard-empty-text">[ NO_DATA ]</div>
                    <div className="dashboard-empty-subtext">complete sessions to see hourly patterns</div>
                </div>
            </div>
        );
    }

    return (
        <div className="hourly-chart">
            <div className="hourly-header">
                <span className="hourly-title">&gt; hourly_productivity</span>
                <span className="hourly-peak">peak: {peakLabel}</span>
            </div>

            <div className="hourly-bars">
                {hours.map(h => {
                    const val = values[h];
                    const heightPct = (val / maxVal) * 100;
                    const isPeak = h === peakHour && maxVal > 0;
                    return (
                        <div
                            key={h}
                            className="hourly-col"
                            title={`${formatHour(h)}: ${val} session${val !== 1 ? "s" : ""}`}
                        >
                            <div className="hourly-bar-wrap">
                                <div
                                    className={`hourly-bar ${isPeak ? "peak" : ""}`}
                                    style={{ height: `${Math.max(heightPct, val > 0 ? 6 : 0)}%` }}
                                />
                            </div>
                            <span className="hourly-label">
                                {SHOW_LABELS.has(h) ? formatHour(h) : ""}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="hourly-summary">
                <span>7-day data · {totalSessions} sessions</span>
            </div>
        </div>
    );
}
