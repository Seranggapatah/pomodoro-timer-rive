import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import type { LayoutMode } from "../types";

interface TimerControlsProps {
    isActive: boolean;
    layout: LayoutMode;
    onToggle: () => void;
    onReset: () => void;
    onComplete?: () => void;
}

/**
 * Tombol Play/Pause dan Reset untuk mengontrol timer.
 */
export function TimerControls({ isActive, layout, onToggle, onReset, onComplete }: TimerControlsProps) {
    const isExpanded = layout === "expanded";
    const isMini = layout === "mini";
    const iconSize = isExpanded ? 28 : (isMini ? 14 : 16);

    return (
        <div className={`controls ${layout}`}>
            {/* Tombol Play / Pause */}
            <button
                onClick={onToggle}
                className={`btn-play ${layout} ${isActive ? "active" : "inactive"}`}
            >
                {isActive
                    ? <Pause size={iconSize} fill="currentColor" />
                    : <Play size={iconSize} fill="currentColor" style={{ marginLeft: 2 }} />
                }
            </button>

            {/* Tombol Rest */}
            <button
                onClick={onReset}
                className={`btn-reset ${layout}`}
                title="Reset timer"
            >
                <RotateCcw size={iconSize} />
            </button>

            {/* Tombol Done / Fast Forward */}
            <button
                onClick={onComplete}
                className={`btn-done ${layout}`}
                title="Selesaikan sesi sekarang (Skip)"
            >
                <SkipForward size={iconSize} />
            </button>
        </div>
    );
}
