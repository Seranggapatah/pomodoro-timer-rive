import { useEffect, useState, useRef } from "react";
import { useRive, useViewModelInstanceNumber } from "@rive-app/react-webgl2";
import catRiv from "../assets/rive/cat.riv";
import type { Mode, RiveMood } from "../types";

interface RiveCharacterProps {
    isActive: boolean;
    isExpanded: boolean;
    mode: Mode;
    mood: RiveMood;
    layoutMode?: string;
    xpPercent?: number; // 0–100, untuk diteruskan ke Rive
}

/**
 * Mapping mood → pose number di Rive.
 * Sesuaikan angka ini dengan pose yang tersedia di file .riv Anda.
 *   idle    → 0 (diam, default)
 *   working → 1 (aktif/bergerak)
 *   happy   → 2 (senang, sesi selesai)
 *   sad     → 3 (sedih, timer di-reset)
 *
 * Catatan: Jika .riv hanya punya 2 pose (0 dan 1),
 * happy/sad akan fallback ke pose 0 setelah timeout.
 */
const MOOD_TO_POSE: Record<RiveMood, number> = {
    idle: 0,
    working: 1,
    happy: 2,
    sad: 3,
};

export function RiveCharacter({ isActive, isExpanded, mode, mood, layoutMode, xpPercent = 0 }: RiveCharacterProps) {
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

        // happy/sad bersifat sementara, kembali ke idle/working setelah beberapa detik
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

    // Sync pose ke Rive
    useEffect(() => {
        if (setPose) {
            setPose(MOOD_TO_POSE[displayMood]);
        }
    }, [setPose, displayMood]);

    // Sync XP percent ke Rive (jika viewmodel punya property "XP")
    useEffect(() => {
        if (setXp) {
            setXp(xpPercent);
        }
    }, [setXp, xpPercent]);

    const size = layoutMode === "mini" ? "mini" : isExpanded ? "expanded" : "compact";

    return (
        <div className={`rive-container ${size}`}>
            {isActive && isExpanded && (
                <div className={`rive-glow ${mode === "focus" ? "focus" : "break"}`} />
            )}
            <div className="rive-inner">
                <RiveComponent
                    className={size === "mini" ? "rive-component-mini" : isExpanded ? "rive-component-expanded" : "rive-component-compact"}
                />
            </div>
        </div>
    );
}
