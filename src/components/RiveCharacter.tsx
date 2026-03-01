import { useEffect } from "react";
import { useRive, useViewModelInstanceNumber } from "@rive-app/react-webgl2";
import catRiv from "../assets/rive/cat.riv";
import type { Mode } from "../types";

interface RiveCharacterProps {
    isActive: boolean;
    isExpanded: boolean;
    mode: Mode;
}

/**
 * Komponen karakter Rive (kucing).
 * Pose berubah otomatis: 1 saat timer aktif, 0 saat tidak aktif.
 */
export function RiveCharacter({ isActive, isExpanded, mode }: RiveCharacterProps) {
    const { RiveComponent, rive } = useRive({
        src: catRiv,
        artboard: "Artboard",
        stateMachines: "State Machine 1",
        autoplay: true,
        autoBind: true,
    });

    const { setValue: setPose } = useViewModelInstanceNumber(
        "Pose",
        // @ts-ignore – viewModelInstance belum ada di type definition
        rive?.viewModelInstance
    );

    // Sync pose dengan state timer
    useEffect(() => {
        if (setPose) {
            setPose(isActive ? 1 : 0);
        }
    }, [setPose, isActive]);

    const size = isExpanded ? "expanded" : "compact";

    return (
        <div className={`rive-container ${size}`}>
            {/* Glow effect saat timer aktif & expanded */}
            {isActive && isExpanded && (
                <div className={`rive-glow ${mode === "focus" ? "focus" : "break"}`} />
            )}

            <div className="rive-inner">
                <RiveComponent
                    className={isExpanded ? "rive-component-expanded" : "rive-component-compact"}
                />
            </div>
        </div>
    );
}
