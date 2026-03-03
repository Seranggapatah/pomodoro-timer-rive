/**
 * Mode timer: fokus kerja atau istirahat.
 */
export type Mode = "focus" | "break";

/**
 * Layout window: mini (widget), compact, expanded.
 */
export type LayoutMode = "mini" | "compact" | "expanded";

/**
 * Struktur data untuk satu sub task.
 */
export interface SubTask {
    id: string;
    text: string;
    completed: boolean;
}

/**
 * Struktur data untuk satu item task.
 */
export interface Task {
    id: string;
    text: string;
    completed: boolean;
    pomodoroCount: number;
    archived?: boolean;
    subtasks?: SubTask[];
    createdAt?: number;
    completedAt?: number;
    timeSpentMinutes?: number;
    tags?: string[];  // tag/kategori task
}

/**
 * Nama tema yang tersedia.
 */
export type ThemeName = "matrix" | "cyberpunk" | "nord" | "dracula" | "catppuccin" | "outrun" | "monochrome";

/**
 * Konfigurasi warna CSS variables untuk setiap tema.
 */
export interface ThemeColors {
    "--bg-primary": string;
    "--bg-secondary": string;
    "--bg-tertiary": string;
    "--border-color": string;
    "--text-primary": string;
    "--text-secondary": string;
    "--text-dim": string;
    "--text-muted": string;
    "--accent-focus": string;
    "--accent-break": string;
    "--accent-danger": string;
    "--accent-success": string;
    "--border-glow": string;
}

/**
 * Statistik harian pomodoro & tasks.
 */
export interface DailyStats {
    date: string;
    sessions: number;
    totalFocusMinutes: number;
    completedTasks: number;
    /** XP yang earned hari ini */
    xpEarned?: number;
    /** Distribusi sesi per jam: key = hour (0-23), value = jumlah sesi */
    hourlyBreakdown?: Record<number, number>;
}

/**
 * Riwayat aktivitas harian per sesi yang selesai (Focus / Break).
 */
export interface TimelineLog {
    id: string;
    timestamp: number;
    type: "focus" | "break";
    durationMinutes: number;
    taskName?: string;
}

/**
 * Data satu hari untuk heatmap (90 hari terakhir).
 */
export interface HeatmapDay {
    date: string;       // "YYYY-MM-DD"
    sessions: number;   // 0 = tidak aktif
    level: 0 | 1 | 2 | 3 | 4;  // intensity level untuk warna
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
 * Data gamification (streak, level, achievement, XP).
 */
export interface GameData {
    streak: number;
    lastActiveDate: string;
    totalSessions: number;
    totalTasksCompleted: number;
    level: number;
    achievements: Achievement[];
    // XP System
    xp: number;          // XP dalam level saat ini
    totalXp: number;     // Total XP sepanjang masa
    xpToNextLevel: number;
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

/**
 * Reminder — task dengan jam notifikasi.
 */
export interface Reminder {
    id: string;
    text: string;
    time: string;       // "HH:MM"
    triggered: boolean;
    createdAt: number;
}
