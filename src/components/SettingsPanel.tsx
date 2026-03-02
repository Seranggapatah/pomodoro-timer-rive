interface SettingsPanelProps {
    focusDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    autoStart: boolean;
    onFocusDurationChange: (minutes: number) => void;
    onBreakDurationChange: (minutes: number) => void;
    onLongBreakDurationChange: (minutes: number) => void;
    onAutoStartChange: (autoStart: boolean) => void;
}

interface DurationRowProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
}

function DurationRow({ label, value, min, max, onChange }: DurationRowProps) {
    return (
        <div className="settings-row">
            <label className="settings-label">{label}</label>
            <button
                className="settings-spinbtn"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
            >
                [-]
            </button>
            <span className="settings-value">{value}</span>
            <button
                className="settings-spinbtn"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
            >
                [+]
            </button>
        </div>
    );
}

/**
 * Panel pengaturan durasi timer (focus, break, long break).
 * Menggunakan tombol [-] [+] terminal-style menggantikan native number input.
 */
export function SettingsPanel({
    focusDuration,
    breakDuration,
    longBreakDuration,
    autoStart,
    onFocusDurationChange,
    onBreakDurationChange,
    onLongBreakDurationChange,
    onAutoStartChange,
}: SettingsPanelProps) {
    return (
        <div className="settings-panel">
            <div className="settings-title">&gt; config</div>
            <DurationRow label="focus_min:" value={focusDuration} min={1} max={120} onChange={onFocusDurationChange} />
            <DurationRow label="break_min:" value={breakDuration} min={1} max={60} onChange={onBreakDurationChange} />
            <DurationRow label="long_break:" value={longBreakDuration} min={1} max={60} onChange={onLongBreakDurationChange} />

            <div className="settings-row toggle-row">
                <label className="settings-label">auto_start:</label>
                <button
                    className={`settings-toggle-btn ${autoStart ? "active" : ""}`}
                    onClick={() => onAutoStartChange(!autoStart)}
                >
                    [{autoStart ? " x " : "   "}]
                </button>
            </div>
        </div>
    );
}
