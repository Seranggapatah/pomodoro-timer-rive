import type { AmbientSound } from "../types";

interface AmbientToggleProps {
    ambientType: AmbientSound;
    onCycle: () => void;
}

const LABELS: Record<AmbientSound, string> = {
    off: "off",
    rain: "rain",
    "white-noise": "noise",
    lofi: "lofi",
};

/**
 * Ambient sound toggle — inline label + small toggle button
 */
export function AmbientToggle({ ambientType, onCycle }: AmbientToggleProps) {
    const isOn = ambientType !== "off";

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500 font-mono">&gt; ambient:</span>
            <button
                onClick={onCycle}
                title={`Ambient: ${LABELS[ambientType]}`}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0 ${
                    isOn ? "bg-orange-500" : "bg-stone-700"
                }`}
            >
                <span
                    className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transform transition-transform ${
                        isOn ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                />
            </button>
            {isOn && (
                <span className="text-[10px] text-stone-400 font-mono uppercase">
                    {LABELS[ambientType]}
                </span>
            )}
        </div>
    );
}
