import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutMode } from "../types";
import type { AsciiSettings } from "../components/AsciiToggle";

// ---------------------------------------------------------------------------
// Helper: baca dari localStorage key lama (one-time migration)
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
// State & Actions
// ---------------------------------------------------------------------------
interface SettingsState {
    layoutMode: LayoutMode;
    showTracker: boolean;
    focusDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    autoStart: boolean;
    ascii: AsciiSettings;

    setLayoutMode: (v: LayoutMode) => void;
    setShowTracker: (v: boolean | ((prev: boolean) => boolean)) => void;
    setFocusDuration: (v: number) => void;
    setBreakDuration: (v: number) => void;
    setLongBreakDuration: (v: number) => void;
    setAutoStart: (v: boolean) => void;
    setAscii: (v: AsciiSettings) => void;
    patchAscii: (patch: Partial<AsciiSettings>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Non-persisted (reset each session)
            layoutMode: "compact" as LayoutMode,
            ascii: {
                enabled: false,
                charset: "detailed",
                color: "#00ff88",
                charSize: 7,
                opacity: 0.9,
                colorBlend: 0.65,
            } as AsciiSettings,

            // Persisted — initial read from old keys for migration
            showTracker: readLS("pomodoro-show-tracker", false),
            focusDuration: readLS("pomodoro-focus-min", 25),
            breakDuration: readLS("pomodoro-break-min", 5),
            longBreakDuration: readLS("pomodoro-longbreak-min", 15),
            autoStart: readLS("pomodoro-autostart", false),

            // Actions
            setLayoutMode: (v) => set({ layoutMode: v }),
            setShowTracker: (v) =>
                set((state) => ({
                    showTracker: typeof v === "function" ? v(state.showTracker) : v,
                })),
            setFocusDuration: (v) => set({ focusDuration: v }),
            setBreakDuration: (v) => set({ breakDuration: v }),
            setLongBreakDuration: (v) => set({ longBreakDuration: v }),
            setAutoStart: (v) => set({ autoStart: v }),
            setAscii: (v) => set({ ascii: v }),
            patchAscii: (patch) =>
                set((state) => ({ ascii: { ...state.ascii, ...patch } })),
        }),
        {
            name: "pomodoro-settings-store",
            partialize: (state) => ({
                showTracker: state.showTracker,
                focusDuration: state.focusDuration,
                breakDuration: state.breakDuration,
                longBreakDuration: state.longBreakDuration,
                autoStart: state.autoStart,
                // layoutMode & ascii are NOT persisted
            }),
        }
    )
);
