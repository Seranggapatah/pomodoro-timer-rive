import { useState, useEffect, useCallback } from "react";
import type { Mode } from "../types";

/**
 * Hook untuk mengelola logika timer Pomodoro.
 * Mendukung custom durasi, long break, session counting, dan callbacks.
 *
 * @param focusDuration    - Durasi focus dalam menit
 * @param breakDuration    - Durasi short break dalam menit
 * @param longBreakDuration - Durasi long break dalam menit
 * @param autoStart        - Apakah auto mulai sesi berikutnya ketika selesai
 * @param onTimerComplete  - Callback saat timer habis
 * @param onTimerReset     - Callback saat timer di-reset sebelum selesai
 */
export function useTimer(
    focusDuration: number,
    breakDuration: number,
    longBreakDuration: number,
    autoStart: boolean = false,
    onTimerComplete?: (completedMode: Mode) => void,
    onTimerReset?: () => void
) {
    const focusSeconds = focusDuration * 60;
    const breakSeconds = breakDuration * 60;
    const longBreakSeconds = longBreakDuration * 60;

    const [timeLeft, setTimeLeft] = useState(focusSeconds);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<Mode>("focus");
    const [sessionCount, setSessionCount] = useState(0); // Jumlah focus session selesai

    // Update timeLeft jika durasi custom berubah dan timer tidak aktif
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(mode === "focus" ? focusSeconds : breakSeconds);
        }
    }, [focusDuration, breakDuration, longBreakDuration]);

    // Handle ketika durasi habis atau diskip manual sebagai "selesai"
    const completeSession = useCallback(() => {
        const completedMode = mode;

        if (!autoStart) {
            setIsActive(false);
        }

        if (mode === "focus") {
            const newCount = sessionCount + 1;
            setSessionCount(newCount);

            if (newCount % 4 === 0) {
                setMode("break");
                setTimeLeft(longBreakSeconds);
            } else {
                setMode("break");
                setTimeLeft(breakSeconds);
            }
        } else {
            setMode("focus");
            setTimeLeft(focusSeconds);
        }

        onTimerComplete?.(completedMode);
    }, [mode, autoStart, sessionCount, longBreakSeconds, breakSeconds, focusSeconds, onTimerComplete]);

    // Countdown logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            completeSession();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, completeSession]);

    const toggleTimer = useCallback(() => setIsActive((prev) => !prev), []);

    const resetTimer = useCallback(() => {
        const wasRunning = isActive;
        setIsActive(false);
        setTimeLeft(mode === "focus" ? focusSeconds : breakSeconds);
        if (wasRunning) {
            onTimerReset?.();
        }
    }, [isActive, mode, focusSeconds, breakSeconds, onTimerReset]);

    const switchMode = useCallback((newMode: Mode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === "focus" ? focusSeconds : breakSeconds);
    }, [focusSeconds, breakSeconds]);

    // Format "MM:SS"
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Sesi ke berapa dari siklus 4
    const sessionInCycle = sessionCount % 4;

    return {
        timeString,
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
