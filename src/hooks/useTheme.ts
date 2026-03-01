import { useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { ThemeName, ThemeColors } from "../types";

/**
 * Preset warna untuk setiap tema.
 */
const THEMES: Record<ThemeName, ThemeColors> = {
    green: {
        "--text-primary": "#00ff41",
        "--text-secondary": "#00cc33",
        "--text-dim": "#007a1f",
        "--text-muted": "#004d13",
        "--accent-focus": "#ff6600",
        "--accent-break": "#00bfff",
        "--accent-success": "#00ff41",
        "--border-glow": "#00ff4133",
    },
    amber: {
        "--text-primary": "#ffb000",
        "--text-secondary": "#cc8c00",
        "--text-dim": "#7a5500",
        "--text-muted": "#4d3500",
        "--accent-focus": "#ff4444",
        "--accent-break": "#44aaff",
        "--accent-success": "#ffb000",
        "--border-glow": "#ffb00033",
    },
    cyan: {
        "--text-primary": "#00ffff",
        "--text-secondary": "#00cccc",
        "--text-dim": "#007a7a",
        "--text-muted": "#004d4d",
        "--accent-focus": "#ff6699",
        "--accent-break": "#66ff66",
        "--accent-success": "#00ffff",
        "--border-glow": "#00ffff33",
    },
    pink: {
        "--text-primary": "#ff66b2",
        "--text-secondary": "#cc5290",
        "--text-dim": "#7a3157",
        "--text-muted": "#4d1f37",
        "--accent-focus": "#ffaa00",
        "--accent-break": "#66ccff",
        "--accent-success": "#ff66b2",
        "--border-glow": "#ff66b233",
    },
};

/**
 * Hook untuk mengelola tema terminal.
 * Tema tersimpan di localStorage dan langsung di-apply ke CSS variables.
 */
export function useTheme() {
    const [themeName, setThemeName] = useLocalStorage<ThemeName>("pomodoro-theme", "green");

    // Apply CSS variables ke :root setiap kali tema berubah
    useEffect(() => {
        const colors = THEMES[themeName];
        const root = document.documentElement;

        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }, [themeName]);

    const cycleTheme = useCallback(() => {
        const names: ThemeName[] = ["green", "amber", "cyan", "pink"];
        const currentIndex = names.indexOf(themeName);
        const nextIndex = (currentIndex + 1) % names.length;
        setThemeName(names[nextIndex]);
    }, [themeName, setThemeName]);

    return {
        themeName,
        setThemeName,
        cycleTheme,
    };
}
