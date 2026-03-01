/**
 * Mode timer: fokus kerja atau istirahat.
 */
export type Mode = "focus" | "break";

/**
 * Layout window: mini (widget), compact, expanded.
 */
export type LayoutMode = "mini" | "compact" | "expanded";

/**
 * Struktur data untuk satu item task.
 */
export interface Task {
    id: string;
    text: string;
    completed: boolean;
    pomodoroCount: number;
}

/**
 * Nama tema yang tersedia.
 */
export type ThemeName = "green" | "amber" | "cyan" | "pink";

/**
 * Konfigurasi warna CSS variables untuk setiap tema.
 */
export interface ThemeColors {
    "--text-primary": string;
    "--text-secondary": string;
    "--text-dim": string;
    "--text-muted": string;
    "--accent-focus": string;
    "--accent-break": string;
    "--accent-success": string;
    "--border-glow": string;
}

/**
 * Statistik harian pomodoro.
 */
export interface DailyStats {
    date: string;
    sessions: number;
    totalFocusMinutes: number;
}

/**
 * Jenis suara ambient tersedia.
 */
export type AmbientSound = "off" | "rain" | "white-noise" | "lofi";

/**
 * Mood kucing Rive berdasarkan state app.
 */
export type RiveMood = "idle" | "working" | "happy" | "sad";

/**
 * Data gamification (streak, level, achievement).
 */
export interface GameData {
    streak: number;
    lastActiveDate: string;
    totalSessions: number;
    level: number;
    achievements: Achievement[];
}

/**
 * Satu achievement / badge.
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
}
