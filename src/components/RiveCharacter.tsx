import { useEffect, useState, useRef } from "react";
import { useRive, useViewModelInstanceNumber } from "@rive-app/react-webgl2";
import catRiv from "../assets/rive/cat.riv";
import type { Mode, RiveMood } from "../types";
import { useAsciiFilter } from "../hooks/useAsciiFilter";
import type { AsciiSettings } from "./AsciiToggle";

interface RiveCharacterProps {
    isActive: boolean;
    isExpanded: boolean;
    mode: Mode;
    mood: RiveMood;
    layoutMode?: string;
    xpPercent?: number;
    ascii?: AsciiSettings;
}

/**
 * Mapping mood → pose number di Rive.
 *   idle    → 0
 *   working → 1
 *   happy   → 2
 *   sad     → 3
 */
const MOOD_TO_POSE: Record<RiveMood, number> = {
    idle: 0,
    working: 1,
    happy: 2,
    sad: 3,
};

export function RiveCharacter({
    isActive,
    isExpanded,
    mode,
    mood,
    layoutMode,
    xpPercent = 0,
    ascii,
}: RiveCharacterProps) {
    const { RiveComponent, rive } = useRive({
        src: catRiv,
        artboard: "Artboard",
        stateMachines: "State Machine 1",
        autoplay: true,
        autoBind: true,
    });

    const { setValue: setPose } = useViewModelInstanceNumber(
        "Pose",
        // @ts-ignore
        rive?.viewModelInstance
    );

    const { setValue: setXp } = useViewModelInstanceNumber(
        "XP",
        // @ts-ignore
        rive?.viewModelInstance
    );

    const [displayMood, setDisplayMood] = useState<RiveMood>(mood);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle mood changes with temporary reactions
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setDisplayMood(mood);

        if (mood === "happy") {
            timeoutRef.current = setTimeout(() => {
                setDisplayMood(isActive ? "working" : "idle");
            }, 3000);
        } else if (mood === "sad") {
            timeoutRef.current = setTimeout(() => {
                setDisplayMood("idle");
            }, 2000);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [mood, isActive]);

    // Sync pose → Rive
    useEffect(() => {
        if (setPose) setPose(MOOD_TO_POSE[displayMood]);
    }, [setPose, displayMood]);

    // Sync XP → Rive
    useEffect(() => {
        if (setXp) setXp(xpPercent);
    }, [setXp, xpPercent]);

    const size = layoutMode === "mini" ? "mini" : isExpanded ? "expanded" : "compact";

    // Derive charSize from ascii settings, or size-based default
    const asciiEnabled = ascii?.enabled ?? false;
    const resolvedCharSize = ascii?.charSize ?? (size === "mini" ? 4 : size === "expanded" ? 7 : 5);

    const { overlayRef, containerRef } = useAsciiFilter({
        charSize: resolvedCharSize,
        charset: ascii?.charset ?? "detailed",
        color: ascii?.color ?? "#00ff88",
        opacity: ascii?.opacity ?? 0.9,
        colorBlend: ascii?.colorBlend ?? 0.65,
        enabled: asciiEnabled,
    });

    return (
        <div className={`rive-container ${size}`}>
            {isActive && isExpanded && (
                <div className={`rive-glow ${mode === "focus" ? "focus" : "break"}`} />
            )}

            {/* ASCII badge when active */}
            {asciiEnabled && (
                <div className="ascii-active-badge" aria-hidden="true">
                    ASCII
                </div>
            )}

            {/* containerRef wraps both Rive + overlay canvas */}
            <div className="rive-inner" ref={containerRef} style={{ position: "relative" }}>
                {/* Rive animation — dimmed when ASCII is on */}
                <div style={{ opacity: asciiEnabled ? 0 : 1, transition: "opacity 0.4s ease", width: "100%", height: "100%", position: "absolute", inset: 0 }}>
                    <RiveComponent
                        className={
                            size === "mini"
                                ? "rive-component-mini"
                                : isExpanded
                                    ? "rive-component-expanded"
                                    : "rive-component-compact"
                        }
                    />
                </div>

                {/* ASCII overlay canvas — drawn from Rive pixels */}
                <canvas
                    ref={overlayRef}
                    className={`ascii-overlay ${asciiEnabled ? "visible" : ""}`}
                    aria-hidden="true"
                    style={{ background: asciiEnabled ? "var(--bg-secondary)" : "transparent" }}
                />
            </div>
        </div>
    );
}
