import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Reminder } from "../types";

function beepReminder() {
    try {
        const ctx = new AudioContext();
        const freqs = [880, 1100, 880];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "square";
            osc.frequency.value = freq;
            gain.gain.value = 0.08;
            const t = ctx.currentTime + i * 0.2;
            osc.start(t);
            osc.stop(t + 0.12);
        });
    } catch { /* no audio ctx */ }
}

function sendDesktopNotif(text: string) {
    try {
        if (Notification.permission === "granted") {
            new Notification("⏰ REMINDER", { body: text });
        }
    } catch { /* no notif api */ }
}

/**
 * Hook untuk mengelola todo reminders.
 * - Persists ke localStorage
 * - Poll tiap 30 detik untuk cek apakah ada reminder yang jatuh tempo
 * - Saat jatuh tempo → beep + desktop notif + in-app alert
 */
export function useReminders() {
    const [reminders, setReminders] = useLocalStorage<Reminder[]>("pomo-reminders", []);
    const [alerts, setAlerts] = useState<Reminder[]>([]);

    // Poll setiap 30 detik
    useEffect(() => {
        const check = () => {
            const now = new Date();
            const nowStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

            setReminders(prev => {
                const toFire = prev.filter(r => !r.triggered && r.time === nowStr);
                if (toFire.length === 0) return prev;

                // Fire alerts
                setAlerts(curr => [...curr, ...toFire]);
                beepReminder();
                toFire.forEach(r => sendDesktopNotif(r.text));

                // Mark triggered
                return prev.map(r =>
                    toFire.some(f => f.id === r.id) ? { ...r, triggered: true } : r
                );
            });
        };

        check();
        const id = setInterval(check, 30_000);
        return () => clearInterval(id);
    }, [setReminders]);

    const addReminder = useCallback((text: string, time: string) => {
        const r: Reminder = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: text.trim(),
            time,
            triggered: false,
            createdAt: Date.now(),
        };
        setReminders(prev => [...prev, r].sort((a, b) => a.time.localeCompare(b.time)));
    }, [setReminders]);

    const deleteReminder = useCallback((id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
    }, [setReminders]);

    const dismissAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    const clearTriggered = useCallback(() => {
        setReminders(prev => prev.filter(r => !r.triggered));
    }, [setReminders]);

    return { reminders, alerts, addReminder, deleteReminder, dismissAlert, clearTriggered };
}
