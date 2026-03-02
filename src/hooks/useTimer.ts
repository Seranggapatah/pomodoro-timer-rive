import { useState, useEffect, useRef, useCallback } from "react";
import type { Mode } from "../types";

/**
 * Hook untuk mengelola logika timer Pomodoro.
 * Menggunakan rAF + performance.now() untuk akurasi millisecond.
 *
 * @param focusDuration     - Durasi focus dalam menit
 * @param breakDuration     - Durasi short break dalam menit
 * @param longBreakDuration - Durasi long break dalam menit
 * @param autoStart         - Apakah auto mulai sesi berikutnya ketika selesai
 * @param onTimerComplete   - Callback saat timer habis
 * @param onTimerReset      - Callback saat timer di-reset sebelum selesai
 */
export function useTimer(
    focusDuration: number,
    breakDuration: number,
    longBreakDuration: number,
    autoStart: boolean = false,
    onTimerComplete?: (completedMode: Mode) => void,
    onTimerReset?: () => void
) {
    const focusMs = focusDuration * 60 * 1000;
    const breakMs = breakDuration * 60 * 1000;
    const longBreakMs = longBreakDuration * 60 * 1000;

    const [msLeft, setMsLeft] = useState(focusMs);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<Mode>("focus");
    const [sessionCount, setSessionCount] = useState(0);

    // Refs for the rAF loop — avoid stale closures
    const msLeftRef = useRef(msLeft);
    const isActiveRef = useRef(false);
    const modeRef = useRef<Mode>("focus");
    const sessionRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number | null>(null);

    // Keep refs in sync with state
    msLeftRef.current = msLeft;
    isActiveRef.current = isActive;
    modeRef.current = mode;
    sessionRef.current = sessionCount;

    // Stable refs for callbacks (avoid dep-array issues)
    const autoStartRef = useRef(autoStart);
    const onTimerCompleteRef = useRef(onTimerComplete);
    const onTimerResetRef = useRef(onTimerReset);
    const focusMsRef = useRef(focusMs);
    const breakMsRef = useRef(breakMs);
    const longBreakMsRef = useRef(longBreakMs);

    autoStartRef.current = autoStart;
    onTimerCompleteRef.current = onTimerComplete;
    onTimerResetRef.current = onTimerReset;
    focusMsRef.current = focusMs;
    breakMsRef.current = breakMs;
    longBreakMsRef.current = longBreakMs;

    // -------------------------------------------------------------------
    // Complete a session (called when timer hits 0)
    // -------------------------------------------------------------------
    const completeSessionRef = useRef<() => void>(() => { });
    completeSessionRef.current = () => {
        const completedMode = modeRef.current;

        if (!autoStartRef.current) setIsActive(false);

        if (completedMode === "focus") {
            const newCount = sessionRef.current + 1;
            setSessionCount(newCount);
            setMode("break");
            setMsLeft(newCount % 4 === 0 ? longBreakMsRef.current : breakMsRef.current);
        } else {
            setMode("focus");
            setMsLeft(focusMsRef.current);
        }
        onTimerCompleteRef.current?.(completedMode);
    };

    // -------------------------------------------------------------------
    // rAF loop
    // -------------------------------------------------------------------
    useEffect(() => {
        const tick = (now: number) => {
            if (!isActiveRef.current) {
                lastTickRef.current = null;
                rafRef.current = null;
                return;
            }

            if (lastTickRef.current === null) {
                lastTickRef.current = now;
            }

            const elapsed = now - lastTickRef.current;
            lastTickRef.current = now;

            setMsLeft(prev => {
                const next = Math.max(0, prev - elapsed);
                if (next === 0) {
                    // Fire completion asynchronously so React state settles first
                    setTimeout(() => completeSessionRef.current(), 0);
                }
                return next;
            });

            rafRef.current = requestAnimationFrame(tick);
        };

        if (isActive) {
            lastTickRef.current = null;
            rafRef.current = requestAnimationFrame(tick);
        } else {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            lastTickRef.current = null;
        }

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [isActive]);

    // -------------------------------------------------------------------
    // Sync duration changes when paused
    // -------------------------------------------------------------------
    useEffect(() => {
        if (!isActive) {
            setMsLeft(mode === "focus" ? focusMs : breakMs);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusDuration, breakDuration, longBreakDuration]);

    // -------------------------------------------------------------------
    // Controls
    // -------------------------------------------------------------------
    const toggleTimer = useCallback(() => setIsActive(prev => !prev), []);

    const resetTimer = useCallback(() => {
        const wasRunning = isActiveRef.current;
        setIsActive(false);
        setMsLeft(modeRef.current === "focus" ? focusMsRef.current : breakMsRef.current);
        if (wasRunning) onTimerResetRef.current?.();
    }, []);

    const switchMode = useCallback((newMode: Mode) => {
        setMode(newMode);
        setIsActive(false);
        setMsLeft(newMode === "focus" ? focusMsRef.current : breakMsRef.current);
    }, []);

    const completeSession = useCallback(() => {
        completeSessionRef.current();
    }, []);

    // -------------------------------------------------------------------
    // Derived display values
    // -------------------------------------------------------------------
    const totalMs = Math.max(0, msLeft);
    const totalSeconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centis = Math.floor((totalMs % 1000) / 10); // 00-99

    /** Full display string: "MM:SS" when paused, "MM:SS.cc" when active */
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    const msString = centis.toString().padStart(2, "0");

    // Session in current 4-cycle
    const sessionInCycle = sessionCount % 4;

    return {
        timeString,
        msString,
        isActive,
        mode,
        sessionCount,
        sessionInCycle,
        toggleTimer,
        resetTimer,
        switchMode,
        completeSession,
    };
}
