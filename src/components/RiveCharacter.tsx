import { useEffect } from "react";
import { useRive, useViewModelInstanceNumber, useViewModelInstanceTrigger } from "@rive-app/react-webgl2";
import catRiv from "../assets/rive/cat_8.riv";
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
 * Mapping mood → Trigger name di Rive.
 */
const MOOD_TO_TRIGGER: Record<RiveMood, string> = {
    idle: "idle",
    focus: "focusLvl1",
    halfway: "focusLvl2",
    almost_done: "focusLvl3",
    break: "Break",
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

    const triggerIdle = useViewModelInstanceTrigger("idle", rive?.viewModelInstance as any);
    const triggerFocus1 = useViewModelInstanceTrigger("focusLvl1", rive?.viewModelInstance as any);
    const triggerFocus2 = useViewModelInstanceTrigger("focusLvl2", rive?.viewModelInstance as any);
    const triggerFocus3 = useViewModelInstanceTrigger("focusLvl3", rive?.viewModelInstance as any);
    const triggerBreak = useViewModelInstanceTrigger("Break", rive?.viewModelInstance as any);

    const { setValue: setXp } = useViewModelInstanceNumber(
        "XP",
        // @ts-ignore
        rive?.viewModelInstance
    );

    // Helper map of all our trigger fire functions
    const triggerVars: Record<string, (() => void) | undefined> = {
        "idle": triggerIdle.trigger,
        "focusLvl1": triggerFocus1.trigger,
        "focusLvl2": triggerFocus2.trigger,
        "focusLvl3": triggerFocus3.trigger,
        "Break": triggerBreak.trigger,
    };

    // Sync trigger → Rive
    useEffect(() => {
        const triggerName = MOOD_TO_TRIGGER[mood];
        const fireTrigger = triggerVars[triggerName];
        if (fireTrigger) {
            fireTrigger();
        }
    }, [mood, triggerIdle.trigger, triggerFocus1.trigger, triggerFocus2.trigger, triggerFocus3.trigger, triggerBreak.trigger]);

    // Sync XP → Rive
    useEffect(() => {
        if (setXp) setXp(xpPercent);
    }, [setXp, xpPercent]);

    const size = layoutMode === "mini" ? "mini" : isExpanded ? "expanded" : "compact";

    // Derive charSize from ascii settings, or size-based default
    const asciiEnabled = (ascii?.enabled ?? false) && !isExpanded;
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
