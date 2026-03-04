import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min safety reconnect

export interface SlabPixelData {
    trackerTime: string | null;
    paused: boolean;
    stopped: boolean;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    startTimer: () => Promise<void>;
    pauseTimer: () => Promise<void>;
    initiateStop: () => Promise<void>;
    confirmStop: () => Promise<void>;
    cancelStop: () => Promise<void>;
    openLogin: () => Promise<void>;
    closeLogin: () => Promise<void>;
}

export function useSlabPixelTracker(): SlabPixelData {
    const [trackerTime, setTrackerTime] = useState<string | null>(null);
    const [paused, setPaused] = useState(false);
    const [stopped, setStopped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await invoke("fetch_tracker_data");
        } catch (e) {
            setError(String(e));
            setIsLoading(false);
        }
    }, []);

    const startTimer = useCallback(async () => {
        try {
            await invoke("start_tracker_timer");
            // Optionally trigger immediate refresh to see state change faster
            refresh();
        } catch (e) {
            setError(String(e));
        }
    }, [refresh]);

    const pauseTimer = useCallback(async () => {
        try {
            await invoke("pause_tracker_timer");
        } catch (e) {
            setError(String(e));
        }
    }, []);

    const initiateStop = useCallback(async () => {
        try {
            await invoke("initiate_stop_tracker");
        } catch (e) {
            setError(String(e));
        }
    }, []);

    const confirmStop = useCallback(async () => {
        try {
            await invoke("confirm_stop_tracker");
        } catch (e) {
            setError(String(e));
        }
    }, []);

    const cancelStop = useCallback(async () => {
        try {
            await invoke("cancel_stop_tracker");
        } catch (e) {
            setError(String(e));
        }
    }, []);

    const openLogin = useCallback(async () => {
        try {
            await invoke("show_tracker_login");
        } catch (e) {
            setError(String(e));
        }
    }, []);

    const closeLogin = useCallback(async () => {
        try {
            await invoke("hide_tracker_window");
        } catch (e) {
            setError(String(e));
        }
    }, []);

    useEffect(() => {
        let unlistenFn: (() => void) | null = null;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const setup = async () => {
            const fn = await listen<{
                time: string | null;
                paused: boolean;
                stopped: boolean;
                error: string | null;
            }>("tracker-data", (event) => {
                setIsLoading(false);
                if (event.payload.error) {
                    setError(event.payload.error);
                } else {
                    setTrackerTime(event.payload.time);
                    setPaused(event.payload.paused ?? false);
                    setStopped(event.payload.stopped ?? false);
                    setError(null);
                }
            });
            unlistenFn = fn;

            await refresh();
            intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
        };

        setup();

        return () => {
            unlistenFn?.();
            if (intervalId !== null) clearInterval(intervalId);
        };
    }, [refresh]);

    return { trackerTime, paused, stopped, isLoading, error, refresh, startTimer, pauseTimer, initiateStop, confirmStop, cancelStop, openLogin, closeLogin };
}
