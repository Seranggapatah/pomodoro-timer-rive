
import type { TimelineLog } from '../types';

interface TimelineHistoryProps {
    logs: TimelineLog[];
}

function formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * Komponen untuk menampilkan histori aktivitas pomodoro
 * dalam bentuk timeline text ala terminal.
 */
export function TimelineHistory({ logs }: TimelineHistoryProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="panel module-box timeline-history empty">
                <span className="window-title">&gt; activity_log.txt</span>
                <p className="text-muted">No activity yet. Start your first focus session!</p>
            </div>
        );
    }

    // Filter log hanya untuk hari ini agar fokus ke daily overview.
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);

    if (todayLogs.length === 0) {
        return (
            <div className="panel module-box timeline-history empty">
                <span className="window-title">&gt; activity_log.txt</span>
                <p className="text-muted">No activity recorded today.</p>
            </div>
        );
    }

    return (
        <div className="panel module-box timeline-history">
            <span className="window-title">&gt; activity_log.txt</span>

            <div className="timeline-list">
                {todayLogs.map(log => {
                    const timeStr = formatTime(log.timestamp);
                    const isFocus = log.type === "focus";

                    return (
                        <div key={log.id} className={`timeline-item ${log.type}`}>
                            <div className="timeline-time">[{timeStr}]</div>
                            <div className="timeline-content">
                                <span className={`timeline-icon ${log.type}`}>
                                    {isFocus ? "🍅" : "☕"}
                                </span>
                                <span className={`timeline-type ${log.type}`}>
                                    {isFocus ? "Focus" : "Break"} ({log.durationMinutes}m)
                                </span>
                                {isFocus && log.taskName && (
                                    <span className="timeline-task">
                                        &mdash; "{log.taskName}"
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div className="timeline-end">EOF</div>
            </div>
        </div>
    );
}
