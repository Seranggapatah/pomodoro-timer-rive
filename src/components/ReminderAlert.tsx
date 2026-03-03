import type { Reminder } from "../types";

interface ReminderAlertProps {
    alerts: Reminder[];
    onDismiss: (id: string) => void;
}

/**
 * In-app terminal-style alert stack yang muncul di pojok bawah
 * ketika reminder jatuh tempo. Bisa dismiss satu per satu dengan ×.
 */
export function ReminderAlert({ alerts, onDismiss }: ReminderAlertProps) {
    if (alerts.length === 0) return null;

    return (
        <div className="reminder-alerts-stack">
            {alerts.map(alert => (
                <div key={alert.id} className="reminder-alert">
                    <span className="reminder-alert-icon">!</span>
                    <div className="reminder-alert-body">
                        <span className="reminder-alert-label">REMINDER_ALERT</span>
                        <span className="reminder-alert-text">{alert.text}</span>
                        <span className="reminder-alert-time">{alert.time}</span>
                    </div>
                    <button
                        className="reminder-alert-dismiss"
                        onClick={() => onDismiss(alert.id)}
                        title="Dismiss"
                    >
                        [×]
                    </button>
                </div>
            ))}
        </div>
    );
}
