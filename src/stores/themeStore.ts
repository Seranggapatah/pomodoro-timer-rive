import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeName, ThemeColors } from "../types";

// ---------------------------------------------------------------------------
// Theme palettes (migrated from useTheme.ts)
// ---------------------------------------------------------------------------
const THEMES: Record<ThemeName, ThemeColors> = {
    matrix: {
        "--bg-primary": "#0a0a0a",
        "--bg-secondary": "#111111",
        "--bg-tertiary": "#1a1a1a",
        "--border-color": "#2a2a2a",
        "--text-primary": "#00ff41",
        "--text-secondary": "#00cc33",
        "--text-dim": "#007a1f",
        "--text-muted": "#004d13",
        "--accent-focus": "#ff6600",
        "--accent-break": "#00bfff",
        "--accent-danger": "#ff3333",
        "--accent-success": "#00ff41",
        "--border-glow": "#00ff4133",
    },
    cyberpunk: {
        "--bg-primary": "#0d0221",
        "--bg-secondary": "#150436",
        "--bg-tertiary": "#1e074d",
        "--border-color": "#3f146a",
        "--text-primary": "#fcee09",
        "--text-secondary": "#ff003c",
        "--text-dim": "#b1016d",
        "--text-muted": "#680153",
        "--accent-focus": "#ff003c",
        "--accent-break": "#0df0d2",
        "--accent-danger": "#ff003c",
        "--accent-success": "#fcee09",
        "--border-glow": "#ff003c66",
    },
    nord: {
        "--bg-primary": "#2e3440",
        "--bg-secondary": "#3b4252",
        "--bg-tertiary": "#434c5e",
        "--border-color": "#4c566a",
        "--text-primary": "#eceff4",
        "--text-secondary": "#8fbcbb",
        "--text-dim": "#88c0d0",
        "--text-muted": "#81a1c1",
        "--accent-focus": "#bf616a",
        "--accent-break": "#5e81ac",
        "--accent-danger": "#bf616a",
        "--accent-success": "#a3be8c",
        "--border-glow": "#88c0d033",
    },
    dracula: {
        "--bg-primary": "#282a36",
        "--bg-secondary": "#44475a",
        "--bg-tertiary": "#6272a4",
        "--border-color": "#6272a4",
        "--text-primary": "#f8f8f2",
        "--text-secondary": "#ff79c6",
        "--text-dim": "#bd93f9",
        "--text-muted": "#6272a4",
        "--accent-focus": "#ffb86c",
        "--accent-break": "#8be9fd",
        "--accent-danger": "#ff5555",
        "--accent-success": "#50fa7b",
        "--border-glow": "#ff79c644",
    },
    catppuccin: {
        "--bg-primary": "#24273a",
        "--bg-secondary": "#1e2030",
        "--bg-tertiary": "#363a4f",
        "--border-color": "#494d64",
        "--text-primary": "#cad3f5",
        "--text-secondary": "#f5bde6",
        "--text-dim": "#8aadf4",
        "--text-muted": "#5b6078",
        "--accent-focus": "#ed8796",
        "--accent-break": "#8aadf4",
        "--accent-danger": "#ed8796",
        "--accent-success": "#a6da95",
        "--border-glow": "#f5bde633",
    },
    outrun: {
        "--bg-primary": "#14002e",
        "--bg-secondary": "#21004a",
        "--bg-tertiary": "#390066",
        "--border-color": "#ff00aa",
        "--text-primary": "#00ffcc",
        "--text-secondary": "#ff00aa",
        "--text-dim": "#ff6600",
        "--text-muted": "#7a0099",
        "--accent-focus": "#ff6600",
        "--accent-break": "#00ffcc",
        "--accent-danger": "#ff0044",
        "--accent-success": "#00ffcc",
        "--border-glow": "#ff00aa55",
    },
    monochrome: {
        "--bg-primary": "#000000",
        "--bg-secondary": "#080808",
        "--bg-tertiary": "#111111",
        "--border-color": "#333333",
        "--text-primary": "#ffffff",
        "--text-secondary": "#cccccc",
        "--text-dim": "#888888",
        "--text-muted": "#444444",
        "--accent-focus": "#ffffff",
        "--accent-break": "#888888",
        "--accent-danger": "#ffffff",
        "--accent-success": "#cccccc",
        "--border-glow": "#ffffff22",
    },
};

// ---------------------------------------------------------------------------
// Apply CSS variables to :root
// ---------------------------------------------------------------------------
function applyThemeColors(themeName: ThemeName) {
    const colors = THEMES[themeName] || THEMES["matrix"];
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
            themeName: readLS<ThemeName>("pomodoro-theme", "matrix"),

            setThemeName: (name) => set({ themeName: name }),

            cycleTheme: () => {
                const names: ThemeName[] = [
                    "matrix",
                    "cyberpunk",
                    "nord",
                    "dracula",
                    "catppuccin",
                    "outrun",
                    "monochrome",
                ];
                const idx = names.indexOf(get().themeName);
                set({ themeName: names[(idx + 1) % names.length] });
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
