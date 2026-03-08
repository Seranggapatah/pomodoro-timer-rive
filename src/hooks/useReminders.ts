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

let hasFiredSessionWelcome = false;

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
            const todayDateStr = now.toDateString();

            // 1. Session Welcome Event
            // Terjadi setiap kali aplikasi dibuka/direfresh. Tidak peduli jam atau hari.
            if (!hasFiredSessionWelcome) {
                const welcomeMsg = "Hello sir, welcome back!";
                const welcomeAlert = {
                    id: "session-welcome-" + Date.now(),
                    text: welcomeMsg,
                    time: nowStr,
                    triggered: true,
                    createdAt: Date.now(),
                };

                setAlerts(curr => {
                    if (curr.some(a => a.text === welcomeMsg)) return curr;
                    return [...curr, welcomeAlert];
                });
                beepReminder();
                sendDesktopNotif(welcomeMsg);
                hasFiredSessionWelcome = true;
            }

            // 2. Daily 10 AM Event
            // Terjadi sekali sehari, jika jam sudah >= 10.
            if (now.getHours() >= 10) {
                const lastMorningFired = localStorage.getItem("pomodoro-morning-notif-date");
                if (lastMorningFired !== todayDateStr) {
                    const morningMsg = "Selamat pagi? Wanna work today?";
                    const morningAlert = {
                        id: "daily-morning-routine-" + Date.now(),
                        text: morningMsg,
                        time: nowStr,
                        triggered: true,
                        createdAt: Date.now(),
                    };

                    setAlerts(curr => {
                        if (curr.some(a => a.text === morningMsg)) return curr;
                        return [...curr, morningAlert];
                    });
                    beepReminder();
                    sendDesktopNotif(morningMsg);
                    localStorage.setItem("pomodoro-morning-notif-date", todayDateStr);
                }
            }

            setReminders(prev => {
                const toFire = prev.filter(r => !r.triggered && r.time === nowStr);
                if (toFire.length === 0) return prev;

                // Fire user alerts
                setAlerts(curr => {
                    const existingIds = new Set(curr.map(a => a.id));
                    const newAlerts = toFire.filter(a => !existingIds.has(a.id));
                    return [...curr, ...newAlerts];
                });
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

    const triggerMorningNotification = useCallback(() => {
        const morningMsg = "Hello sir, welcome back! Selamat pagi? Wanna work today?";
        const morningAlert = {
            id: "daily-morning-routine-" + Date.now(),
            text: morningMsg,
            time: "10:00",
            triggered: true,
            createdAt: Date.now(),
        };
        setAlerts(curr => [...curr, morningAlert]);
        beepReminder();
        sendDesktopNotif(morningMsg);
        // Force update the local storage date so we don't accidentally double-trigger it later today if we test it before 10 AM
        localStorage.setItem("pomodoro-morning-notif-date", new Date().toDateString());
    }, []);

    const triggerSessionWelcomeNotification = useCallback(() => {
        const welcomeMsg = "Hello sir, welcome back!";
        const welcomeAlert = {
            id: "session-welcome-" + Date.now(),
            text: welcomeMsg,
            time: "now",
            triggered: true,
            createdAt: Date.now(),
        };
        setAlerts(curr => [...curr, welcomeAlert]);
        beepReminder();
        sendDesktopNotif(welcomeMsg);
    }, []);

    return { reminders, alerts, addReminder, deleteReminder, dismissAlert, clearTriggered, triggerMorningNotification, triggerSessionWelcomeNotification };
}
