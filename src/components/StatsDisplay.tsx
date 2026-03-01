interface StatsDisplayProps {
    todaySessions: number;
    todayFocusMinutes: number;
    sessionInCycle: number; // 0-3, posisi dalam siklus 4 sesi
}

/**
 * Menampilkan statistik harian dalam gaya terminal.
 */
export function StatsDisplay({ todaySessions, todayFocusMinutes, sessionInCycle }: StatsDisplayProps) {
    // Progress bar visual: [██░░] (4 slot)
    const filled = sessionInCycle;
    const empty = 4 - filled;
    const progressBar = "█".repeat(filled) + "░".repeat(empty);

    return (
        <div className="stats-display">
            <div className="stats-title">&gt; stats_today</div>
            <div className="stats-row">
                <span className="stats-label">sessions:</span>
                <span className="stats-value">{todaySessions}</span>
            </div>
            <div className="stats-row">
                <span className="stats-label">focus_time:</span>
                <span className="stats-value">{todayFocusMinutes} min</span>
            </div>
            <div className="stats-row">
                <span className="stats-label">cycle:</span>
                <span className="stats-value">{sessionInCycle}/4 [{progressBar}]</span>
            </div>
        </div>
    );
}
