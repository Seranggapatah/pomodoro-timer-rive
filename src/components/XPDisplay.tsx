import { useEffect, useRef, useState } from "react";

interface XPDisplayProps {
    level: number;
    xp: number;
    xpToNextLevel: number;
    xpPercent: number;
    totalXp: number;
}

/**
 * XP bar + level display dengan animasi fill saat XP bertambah.
 */
export function XPDisplay({ level, xp, xpToNextLevel, xpPercent, totalXp }: XPDisplayProps) {
    const [animatedPercent, setAnimatedPercent] = useState(xpPercent);
    const [showGain, setShowGain] = useState(false);
    const [gainAmount, setGainAmount] = useState(0);
    const prevXpRef = useRef(xp);
    const gainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animasikan XP bar ketika XP bertambah
    useEffect(() => {
        const diff = xp - prevXpRef.current;
        // diff > 0: xp naik biasa; diff < 0: bisa berarti level-up (xp wrap)
        if (diff !== 0) {
            // Hitung actual XP gained (level-up mungkin wrap angka)
            const gained = diff > 0 ? diff : xpToNextLevel + diff;
            setGainAmount(gained > 0 ? gained : 0);
            setShowGain(true);

            if (gainTimeoutRef.current) clearTimeout(gainTimeoutRef.current);
            gainTimeoutRef.current = setTimeout(() => setShowGain(false), 2000);
        }
        prevXpRef.current = xp;

        // Smooth animate ke percent baru
        const timer = setTimeout(() => setAnimatedPercent(xpPercent), 50);
        return () => clearTimeout(timer);
    }, [xp, xpPercent, xpToNextLevel]);

    // Warna bar berdasarkan percent
    const barColor = xpPercent >= 80
        ? "xp-bar-fill--high"
        : xpPercent >= 40
            ? "xp-bar-fill--mid"
            : "xp-bar-fill--low";

    return (
        <div className="xp-display">
            {/* Header row: level badge + xp numbers */}
            <div className="xp-header">
                <div className="xp-level-badge">
                    <span className="xp-level-icon">★</span>
                    <span className="xp-level-text">LVL {level}</span>
                </div>

                <div className="xp-numbers">
                    <span className="xp-current">{xp}</span>
                    <span className="xp-separator"> / </span>
                    <span className="xp-max">{xpToNextLevel} XP</span>
                </div>

                {/* Floating "+XP" notification */}
                {showGain && gainAmount > 0 && (
                    <div className="xp-gain-popup">+{gainAmount} XP</div>
                )}
            </div>

            {/* Progress bar */}
            <div className="xp-bar-track">
                <div
                    className={`xp-bar-fill ${barColor}`}
                    style={{ width: `${animatedPercent}%` }}
                />
                {/* Scanline overlay */}
                <div className="xp-bar-scanline" />
            </div>

            {/* Footer: percent + total XP */}
            <div className="xp-footer">
                <span className="xp-percent">{xpPercent}% to next level</span>
                <span className="xp-total">total: {totalXp.toLocaleString()} XP</span>
            </div>
        </div>
    );
}
