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
 * Tombol cycle ambient sound: off → rain → noise → lofi → off
 */
export function AmbientToggle({ ambientType, onCycle }: AmbientToggleProps) {
    return (
        <div className="ambient-toggle">
            <span className="ambient-label">&gt; ambient:</span>
            <button onClick={onCycle} className={`ambient-btn ${ambientType !== "off" ? "active" : ""}`}>
                [{LABELS[ambientType]}]
            </button>
        </div>
    );
}
