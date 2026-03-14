import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Reminder } from "../types";

function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
}

function beepReminder() {
    try {
        const ctx = new AudioContext();
        [880, 1100, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = "square"; osc.frequency.value = freq; gain.gain.value = 0.08;
            const t = ctx.currentTime + i * 0.2;
            osc.start(t); osc.stop(t + 0.12);
        });
    } catch { /* */ }
}

function sendDesktopNotif(text: string) {
    try { if (Notification.permission === "granted") new Notification("⏰ REMINDER", { body: text }); } catch { /* */ }
}

let hasFiredSessionWelcome = false;

interface RemindersState {
    reminders: Reminder[];
    alerts: Reminder[];
    addReminder: (text: string, time: string) => void;
    deleteReminder: (id: string) => void;
    dismissAlert: (id: string) => void;
    clearTriggered: () => void;
    triggerMorningNotification: () => void;
    triggerSessionWelcomeNotification: () => void;
    _checkAndFire: () => void;
}

export const useRemindersStore = create<RemindersState>()(
    persist(
        (set, get) => ({
            reminders: readLS<Reminder[]>("pomo-reminders", []),
            alerts: [],

            addReminder: (text, time) => {
                const r: Reminder = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: text.trim(), time, triggered: false, createdAt: Date.now() };
                set(s => ({ reminders: [...s.reminders, r].sort((a, b) => a.time.localeCompare(b.time)) }));
            },
            deleteReminder: (id) => set(s => ({ reminders: s.reminders.filter(r => r.id !== id) })),
            dismissAlert: (id) => set(s => ({ alerts: s.alerts.filter(a => a.id !== id) })),
            clearTriggered: () => set(s => ({ reminders: s.reminders.filter(r => !r.triggered) })),

            triggerMorningNotification: () => {
                const msg = "Hello sir, welcome back! Selamat pagi? Wanna work today?";
                const alert: Reminder = { id: "daily-morning-routine-" + Date.now(), text: msg, time: "10:00", triggered: true, createdAt: Date.now() };
                set(s => ({ alerts: [...s.alerts, alert] }));
                beepReminder(); sendDesktopNotif(msg);
                localStorage.setItem("pomodoro-morning-notif-date", new Date().toDateString());
            },

            triggerSessionWelcomeNotification: () => {
                const msg = "Hello sir, welcome back!";
                const alert: Reminder = { id: "session-welcome-" + Date.now(), text: msg, time: "now", triggered: true, createdAt: Date.now() };
                set(s => ({ alerts: [...s.alerts, alert] }));
                beepReminder(); sendDesktopNotif(msg);
            },

            _checkAndFire: () => {
                const now = new Date();
                const nowStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                const todayDateStr = now.toDateString();

                if (!hasFiredSessionWelcome) {
                    const msg = "Hello sir, welcome back!";
                    set(s => { if (s.alerts.some(a => a.text === msg)) return s; return { alerts: [...s.alerts, { id: "session-welcome-" + Date.now(), text: msg, time: nowStr, triggered: true, createdAt: Date.now() }] }; });
                    beepReminder(); sendDesktopNotif(msg); hasFiredSessionWelcome = true;
                }

                if (now.getHours() >= 10) {
                    if (localStorage.getItem("pomodoro-morning-notif-date") !== todayDateStr) {
                        const msg = "Selamat pagi? Wanna work today?";
                        set(s => { if (s.alerts.some(a => a.text === msg)) return s; return { alerts: [...s.alerts, { id: "daily-morning-routine-" + Date.now(), text: msg, time: nowStr, triggered: true, createdAt: Date.now() }] }; });
                        beepReminder(); sendDesktopNotif(msg);
                        localStorage.setItem("pomodoro-morning-notif-date", todayDateStr);
                    }
                }

                const { reminders } = get();
                const toFire = reminders.filter(r => !r.triggered && r.time === nowStr);
                if (toFire.length > 0) {
                    set(s => {
                        const ids = new Set(s.alerts.map(a => a.id));
                        return { reminders: s.reminders.map(r => toFire.some(f => f.id === r.id) ? { ...r, triggered: true } : r), alerts: [...s.alerts, ...toFire.filter(a => !ids.has(a.id))] };
                    });
                    beepReminder(); toFire.forEach(r => sendDesktopNotif(r.text));
                }
            },
        }),
        { name: "pomodoro-reminders-store", partialize: (s) => ({ reminders: s.reminders }) }
    )
);

export function useRemindersEffect() {
    useEffect(() => {
        const check = () => useRemindersStore.getState()._checkAndFire();
        check();
        const id = setInterval(check, 30_000);
        return () => clearInterval(id);
    }, []);
}
