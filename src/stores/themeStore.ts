import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeName, ThemeColors } from "../types";

// ---------------------------------------------------------------------------
// Theme palettes (migrated from useTheme.ts)
// ---------------------------------------------------------------------------
const THEMES: Record<ThemeName, ThemeColors> = {
    warm: {
        "--bg-primary": "#F5F3EF",
        "--bg-secondary": "#FFFFFF",
        "--bg-tertiary": "#FFFFFF",
        "--border-color": "rgba(0,0,0,0.07)",
        "--text-primary": "#1C1917",
        "--text-secondary": "#78716C",
        "--text-dim": "#78716C",
        "--text-muted": "#A8A29E",
        "--accent-focus": "#DC6B4A",
        "--accent-break": "#38BDF8",
        "--accent-danger": "#DC2626",
        "--accent-success": "#16a34a",
        "--border-glow": "rgba(220, 107, 74, 0.2)",
        "--font-family": "'DM Sans', system-ui, sans-serif",
        "--border-radius": "16px",
    },
    warmDark: {
        "--bg-primary": "#0F172A",
        "--bg-secondary": "#1E293B",
        "--bg-tertiary": "#1E293B",
        "--border-color": "rgba(255,255,255,0.07)",
        "--text-primary": "#F1F5F9",
        "--text-secondary": "#94A3B8",
        "--text-dim": "#94A3B8",
        "--text-muted": "#64748B",
        "--accent-focus": "#38BDF8",
        "--accent-break": "#38BDF8",
        "--accent-danger": "#EF4444",
        "--accent-success": "#22C55E",
        "--border-glow": "rgba(56, 189, 248, 0.2)",
        "--font-family": "'DM Sans', system-ui, sans-serif",
        "--border-radius": "16px",
    }
};

// ---------------------------------------------------------------------------
// Apply CSS variables to :root
// ---------------------------------------------------------------------------
function applyThemeColors(themeName: ThemeName) {
    const colors = THEMES[themeName] || THEMES["warm"];
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

// ---------------------------------------------------------------------------
function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

// ---------------------------------------------------------------------------
interface ThemeState {
    themeName: ThemeName;
    setThemeName: (name: ThemeName) => void;
    cycleTheme: () => void;
}

// ---------------------------------------------------------------------------
export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themeName: readLS<ThemeName>("pomodoro-theme", "warm" as ThemeName),

            setThemeName: (name) => set({ themeName: name }),

            cycleTheme: () => {
                const names: ThemeName[] = ["warm" as ThemeName, "warmDark" as ThemeName];
                const idx = names.indexOf(get().themeName);
                if (idx === -1) {
                    set({ themeName: "warmDark" as ThemeName });
                } else {
                    set({ themeName: names[(idx + 1) % names.length] });
                }
            },
        }),
        { name: "pomodoro-theme-store" }
    )
);

// ---------------------------------------------------------------------------
// Side-effect: apply CSS vars on any theme change (runs outside React)
// ---------------------------------------------------------------------------
useThemeStore.subscribe((state) => applyThemeColors(state.themeName));
// Apply immediately for the initial state / hydration
applyThemeColors(useThemeStore.getState().themeName);
