import { useState, useEffect } from "react";
import type { LayoutMode } from "../types";

interface BreakOverlayProps {
    msLeft: number;
    totalMs: number;
    timeString: string;
    isActive: boolean;
    layout: LayoutMode;
}

const FLAVOR: string[] = [
    "> hydration.bat running...",
    "> focus.exe resumes shortly",
    "> brain.tmp defragmenting...",
    "> skill_issue.log cleared",
    "> coffee.sh --hot --now",
    "> context_switch: done",
    "> eyes.rest --passive",
    "> stretch_break.sh running",
    "> recovery_mode: ON",
];

/**
 * Overlay muncul saat break mode aktif.
 * Compact → progress bar + time only.
 * Expanded → header + progress + rotating flavor text, di bawah timer.
 */
export function BreakOverlay({ msLeft, totalMs, timeString, isActive, layout }: BreakOverlayProps) {
    const [flavorIdx, setFlavorIdx] = useState(Math.floor(Math.random() * FLAVOR.length));

    // Rotate flavor text every 7 seconds
    useEffect(() => {
        const id = setInterval(() => {
            setFlavorIdx(prev => (prev + 1) % FLAVOR.length);
        }, 7000);
        return () => clearInterval(id);
    }, []);

    const isExpanded = layout === "expanded";

    // Progress bar: filled = break elapsed, empty = remaining
    const progress = totalMs > 0 ? 1 - msLeft / totalMs : 0;
    const barW = isExpanded ? 22 : 16;
    const filled = Math.round(progress * barW);
    const bar = "█".repeat(filled) + "░".repeat(barW - filled);

    return (
        <div className={`break-overlay${isActive ? " active" : ""}${isExpanded ? " expanded" : ""}`}>
            {isExpanded && (
                <div className="break-header">▶ BREAK_IN_PROGRESS</div>
            )}

            <div className="break-progress">
                <span className="break-bar">[{bar}]</span>
                <span className="break-time">{timeString}</span>
            </div>

            {isExpanded && (
                <div className="break-flavor" key={flavorIdx}>
                    {FLAVOR[flavorIdx]}
                </div>
            )}
        </div>
    );
}
