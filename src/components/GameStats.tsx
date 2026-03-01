import type { Achievement } from "../types";

interface GameStatsProps {
    streak: number;
    totalSessions: number;
    level: number;
    achievements: Achievement[];
}

/**
 * Terminal-style gamification display: streak, level, achievements.
 */
export function GameStats({ streak, totalSessions, level, achievements }: GameStatsProps) {
    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return (
        <div className="game-stats">
            <div className="game-title">&gt; player_stats</div>

            <div className="game-info-row">
                <span className="game-label">level:</span>
                <span className="game-value game-level">★ {level}</span>
            </div>
            <div className="game-info-row">
                <span className="game-label">streak:</span>
                <span className="game-value game-streak">🔥 {streak} day{streak !== 1 ? "s" : ""}</span>
            </div>
            <div className="game-info-row">
                <span className="game-label">total:</span>
                <span className="game-value">{totalSessions} sessions</span>
            </div>
            <div className="game-info-row">
                <span className="game-label">next_lvl:</span>
                <span className="game-value">{10 - (totalSessions % 10)} sessions left</span>
            </div>

            {/* Achievements */}
            <div className="game-achievements-title">
                &gt; achievements ({unlockedCount}/{achievements.length})
            </div>
            <div className="game-achievements-list">
                {achievements.map((a) => (
                    <span
                        key={a.id}
                        className={`game-badge ${a.unlocked ? "unlocked" : "locked"}`}
                        title={`${a.name}: ${a.description}`}
                    >
                        {a.unlocked ? "◆" : "◇"} {a.name}
                    </span>
                ))}
            </div>
        </div>
    );
}
