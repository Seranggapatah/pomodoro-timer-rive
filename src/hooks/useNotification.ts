import { useCallback } from "react";
import type { Mode } from "../types";

/**
 * Membuat suara beep menggunakan Web Audio API (tanpa file eksternal).
 */
function playAlarmSound() {
    try {
        const audioCtx = new AudioContext();

        // 3 beep pendek berturut-turut
        for (let i = 0; i < 3; i++) {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = "square";
            oscillator.frequency.value = 800 + i * 200; // Nada naik: 800, 1000, 1200 Hz

            gainNode.gain.value = 0.15;

            const startTime = audioCtx.currentTime + i * 0.25;
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
        }
    } catch {
        // Diabaikan jika AudioContext tidak tersedia
    }
}

/**
 * Menampilkan notifikasi desktop Windows.
 */
function showDesktopNotification(completedMode: Mode) {
    const title = completedMode === "focus"
        ? "⏰ Focus Session Selesai!"
        : "☕ Break Time Selesai!";

    const body = completedMode === "focus"
        ? "Saatnya istirahat sejenak."
        : "Saatnya kembali fokus!";

    try {
        if (Notification.permission === "granted") {
            new Notification(title, { body });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(title, { body });
                }
            });
        }
    } catch {
        // Diabaikan jika Notification API tidak tersedia
    }
}

/**
 * Hook untuk mengelola notifikasi dan suara saat timer selesai.
 * Mengembalikan callback `notifyTimerComplete` untuk dioper ke useTimer.
 */
export function useNotification() {
    const notifyTimerComplete = useCallback((completedMode: Mode) => {
        playAlarmSound();
        showDesktopNotification(completedMode);
    }, []);

    // Minta izin notifikasi saat pertama kali
    try {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission();
        }
    } catch {
        // Diabaikan
    }

    return { notifyTimerComplete };
}
