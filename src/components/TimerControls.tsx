import { Play, Pause, RotateCcw } from "lucide-react";

interface TimerControlsProps {
    isActive: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    onReset: () => void;
}

/**
 * Tombol Play/Pause dan Reset untuk mengontrol timer.
 */
export function TimerControls({ isActive, isExpanded, onToggle, onReset }: TimerControlsProps) {
    const size = isExpanded ? "expanded" : "compact";

    return (
        <div className={`controls ${size}`}>
            {/* Tombol Play / Pause */}
            <button
                onClick={onToggle}
                className={`btn-play ${size} ${isActive ? "active" : "inactive"}`}
            >
                {isActive
                    ? <Pause size={isExpanded ? 28 : 16} fill="currentColor" />
                    : <Play size={isExpanded ? 28 : 16} fill="currentColor" style={{ marginLeft: 2 }} />
                }
            </button>

            {/* Tombol Reset */}
            <button
                onClick={onReset}
                className={`btn-reset ${size}`}
                aria-label="Reset Timer"
            >
                <RotateCcw size={isExpanded ? 24 : 14} />
            </button>
        </div>
    );
}
