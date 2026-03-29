import type { Mode } from "../types";

interface ModeToggleProps {
    mode: Mode;
    onSwitchMode: (mode: Mode) => void;
}

/**
 * Pill-style mode toggle: POMODORO / BREAK
 */
export function ModeToggle({ mode, onSwitchMode }: ModeToggleProps) {
    return (
        <div className="flex items-center bg-stone-800 rounded-full p-0.5 gap-0.5">
            <button
                onClick={() => onSwitchMode("focus")}
                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                    mode === "focus"
                        ? "bg-orange-500 text-white"
                        : "text-stone-400 hover:text-stone-200"
                }`}
            >
                POMODORO
            </button>
            <button
                onClick={() => onSwitchMode("break")}
                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                    mode === "break"
                        ? "bg-orange-500 text-white"
                        : "text-stone-400 hover:text-stone-200"
                }`}
            >
                BREAK
            </button>
        </div>
    );
}
