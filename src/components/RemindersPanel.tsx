import { useState } from "react";
import type { Reminder } from "../types";

interface RemindersPanelProps {
    reminders: Reminder[];
    onAdd: (text: string, time: string) => void;
    onDelete: (id: string) => void;
    onClearTriggered: () => void;
}

/**
 * Panel manajemen reminder — terminal-style.
 * Hanya muncul di expanded mode.
 */
export function RemindersPanel({ reminders, onAdd, onDelete, onClearTriggered }: RemindersPanelProps) {
    const [text, setText] = useState("");
    const [time, setTime] = useState("");

    const handleAdd = () => {
        if (text.trim() && time) {
            onAdd(text, time);
            setText("");
            setTime("");
        }
    };

    const pending = reminders.filter(r => !r.triggered);
    const triggered = reminders.filter(r => r.triggered);

    return (
        <div className="reminders-panel">
            <div className="reminders-title">&gt; reminders</div>

            <div className="reminders-form">
                <input
                    className="reminders-text-input"
                    placeholder="task description..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    maxLength={80}
                />
                <input
                    className="reminders-time-input"
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                />
                <button
                    className="reminders-add-btn"
                    onClick={handleAdd}
                    disabled={!text.trim() || !time}
                >
                    [+]
                </button>
            </div>

            {pending.length === 0 && triggered.length === 0 && (
                <div className="reminders-empty">// no reminders set</div>
            )}

            {pending.length > 0 && (
                <div className="reminders-list">
                    {pending.map(r => (
                        <div key={r.id} className="reminder-item">
                            <span className="reminder-item-status pending">○</span>
                            <span className="reminder-item-time">{r.time}</span>
                            <span className="reminder-item-text">{r.text}</span>
                            <button className="reminder-item-delete" onClick={() => onDelete(r.id)}>[x]</button>
                        </div>
                    ))}
                </div>
            )}

            {triggered.length > 0 && (
                <div className="reminders-list triggered-list">
                    {triggered.map(r => (
                        <div key={r.id} className="reminder-item triggered">
                            <span className="reminder-item-status done">✓</span>
                            <span className="reminder-item-time">{r.time}</span>
                            <span className="reminder-item-text">{r.text}</span>
                            <button className="reminder-item-delete" onClick={() => onDelete(r.id)}>[x]</button>
                        </div>
                    ))}
                    <button className="reminders-clear-btn" onClick={onClearTriggered}>
                        [clear done]
                    </button>
                </div>
            )}
        </div>
    );
}
