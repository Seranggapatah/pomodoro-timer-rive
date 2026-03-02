import { useRef, useState } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import type { LayoutMode } from "../types";
import { PlayBurst } from "./PlayBurst";
import { usePlayFeedback, INITIAL_BURST_STATE } from "../hooks/usePlayFeedback";
import type { PlayBurstState } from "../hooks/usePlayFeedback";

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

    const btnRef = useRef<HTMLButtonElement>(null);
    const [burstState, setBurstState] = useState<PlayBurstState>(INITIAL_BURST_STATE);
    const { trigger } = usePlayFeedback(setBurstState, btnRef);

    const handleToggle = () => {
        trigger(isActive); // isActive = true → clicking pause
        onToggle();
    };

    return (
        <>
            {/* Particle + ripple burst overlay */}
            <PlayBurst state={burstState} />

            <div className={`controls ${layout}`}>
                {/* Tombol Play / Pause */}
                <button
                    ref={btnRef}
                    onClick={handleToggle}
                    className={`btn-play ${layout} ${isActive ? "active" : "inactive"} ${burstState.buttonBurst ? "btn-play--burst" : ""}`}
                >
                    {isActive
                        ? <Pause size={iconSize} fill="currentColor" />
                        : <Play size={iconSize} fill="currentColor" style={{ marginLeft: 2 }} />
                    }
                </button>

                {/* Tombol Reset */}
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
        </>
    );
}

