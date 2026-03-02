import { useEffect, useState, useRef } from "react";

interface CatRewardProps {
    show: boolean;
    sessionCount: number;
    onDismiss: () => void;
    // Nanti: riveSrc?: string; // path ke file .riv kucing custom
}

const CAT_FRAMES = [
    `
  ∧＿∧
 (｡•ᴗ•｡)ﾉ
  b  d
`,
    `
  ∧＿∧
 (｡•ᴗ•｡)ﾉ
   b d
`,
    `
  ∧＿∧
 (*•ᴗ•*)ﾉ
  b  d
`,
    `
  ∧＿∧
 (｡>ᴗ<｡)ﾉ
  b  d
`,
];

const MESSAGES = [
    "session_complete!",
    "meow! good job!",
    "purr... +1 focus",
    "nya~ well done!",
    "great work, human!",
];

function getBar(progress: number, total: number, width = 20): string {
    const filled = Math.round((progress / total) * width);
    const empty = width - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

/**
 * CatReward — overlay gamification yang muncul saat sesi focus selesai.
 * Placeholder ASCII art kucing dengan loading bar reward XP.
 * Nanti bisa diganti dengan Rive animation kucing custom.
 */
export function CatReward({ show, sessionCount, onDismiss }: CatRewardProps) {
    const [frame, setFrame] = useState(0);
    const [xpProgress, setXpProgress] = useState(0);
    const [phase, setPhase] = useState<"appear" | "fill" | "done">("appear");
    const [msgIdx] = useState(() => Math.floor(Math.random() * MESSAGES.length));
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // XP per session: 10 XP, level up setiap 100 XP (= 10 sessions)
    const xpPerSession = 10;
    const xpMax = 100;
    const currentXP = ((sessionCount - 1) % 10) * xpPerSession;
    const newXP = currentXP + xpPerSession;

    useEffect(() => {
        if (!show) {
            setXpProgress(0);
            setPhase("appear");
            return;
        }

        // Cat animation loop
        intervalRef.current = setInterval(() => {
            setFrame((f) => (f + 1) % CAT_FRAMES.length);
        }, 300);

        // XP fill animation
        setXpProgress(currentXP);
        const fillTimer = setTimeout(() => {
            setPhase("fill");
            let current = currentXP;
            const fillInterval = setInterval(() => {
                current += 2;
                setXpProgress(Math.min(current, newXP));
                if (current >= newXP) {
                    clearInterval(fillInterval);
                    setPhase("done");
                }
            }, 30);
        }, 400);

        // Auto-dismiss setelah 4 detik
        const dismissTimer = setTimeout(() => {
            onDismiss();
        }, 4200);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            clearTimeout(fillTimer);
            clearTimeout(dismissTimer);
        };
    }, [show]);

    if (!show) return null;

    const leveledUp = newXP >= xpMax;
    const displayXP = Math.min(xpProgress, xpMax);
    const level = Math.floor(sessionCount / 10);

    return (
        <div className="cat-reward-overlay" onClick={onDismiss}>
            <div className="cat-reward-box" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="cat-reward-header">
                    <span className="cat-reward-tag">&gt; session_complete</span>
                    <span className="cat-reward-dismiss" onClick={onDismiss}>[ esc ]</span>
                </div>

                {/* Cat ASCII art placeholder */}
                {/* TODO: Replace with <RiveComponent src={riveSrc} /> */}
                <div className="cat-ascii" aria-label="Happy cat animation">
                    <pre className="cat-art">{CAT_FRAMES[frame]}</pre>
                    <div className="cat-sparkles">
                        <span className="sparkle s1">✦</span>
                        <span className="sparkle s2">⋆</span>
                        <span className="sparkle s3">✦</span>
                        <span className="sparkle s4">⋆</span>
                    </div>
                </div>

                {/* Message */}
                <div className="cat-message">
                    <span className="cat-cursor">$ </span>
                    {MESSAGES[msgIdx]}
                </div>

                {/* XP Bar */}
                <div className="cat-xp-section">
                    <div className="cat-xp-label">
                        <span>xp</span>
                        <span className="cat-xp-value">{displayXP} / {xpMax}</span>
                    </div>
                    <div className="cat-xp-bar-track">
                        <div
                            className="cat-xp-bar-fill"
                            style={{ width: `${(displayXP / xpMax) * 100}%` }}
                        />
                    </div>
                    <div className="cat-xp-terminal">
                        {getBar(displayXP, xpMax)} +{xpPerSession}xp
                    </div>
                </div>

                {/* Level up banner */}
                {leveledUp && phase === "done" && (
                    <div className="cat-levelup">
                        ★ LEVEL UP! → Lv.{level} ★
                    </div>
                )}

                {/* Stats row */}
                <div className="cat-stats-row">
                    <span>session #{sessionCount}</span>
                    <span className="cat-stat-sep">│</span>
                    <span>lv.{level}</span>
                    <span className="cat-stat-sep">│</span>
                    <span>streak 🔥</span>
                </div>

                {/* Click to dismiss hint */}
                <div className="cat-hint">
                    {phase !== "done" ? "loading reward..." : "[ click anywhere to close ]"}
                </div>
            </div>
        </div>
    );
}
