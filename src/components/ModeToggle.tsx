import type { Mode } from "../types";

interface ModeToggleProps {
    mode: Mode;
    onSwitchMode: (mode: Mode) => void;
}

/**
 * Tombol mode terminal-style: FOCUS / BREAK
 */
export function ModeToggle({ mode, onSwitchMode }: ModeToggleProps) {
    return (
        <div className="mode-toggles visible">
            <button
                onClick={() => onSwitchMode("focus")}
                className={`mode-btn ${mode === "focus" ? "focus-active" : "inactive"}`}
            >
                [pomodoro]
            </button>
            <button
                onClick={() => onSwitchMode("break")}
                className={`mode-btn ${mode === "break" ? "break-active" : "inactive"}`}
            >
                [break]
            </button>
        </div>
    );
}
