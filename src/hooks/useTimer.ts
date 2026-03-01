import { useState, useEffect } from "react";
import type { Mode } from "../types";

const FOCUS_DURATION = 25 * 60; // 25 menit dalam detik
const BREAK_DURATION = 5 * 60;  // 5 menit dalam detik

/**
 * Hook untuk mengelola logika timer Pomodoro.
 * Mengatur countdown, toggle play/pause, reset, dan pergantian mode otomatis.
 */
export function useTimer() {
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<Mode>("focus");

    // Countdown logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Timer habis: otomatis pindah mode
            setIsActive(false);
            if (mode === "focus") {
                setMode("break");
                setTimeLeft(BREAK_DURATION);
            } else {
                setMode("focus");
                setTimeLeft(FOCUS_DURATION);
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive((prev) => !prev);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === "focus" ? FOCUS_DURATION : BREAK_DURATION);
    };

    const switchMode = (newMode: Mode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === "focus" ? FOCUS_DURATION : BREAK_DURATION);
    };

    // Format waktu menjadi "MM:SS"
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return {
        timeString,
        isActive,
        mode,
        toggleTimer,
        resetTimer,
        switchMode,
    };
}
