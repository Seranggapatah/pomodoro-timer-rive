import { useEffect, useCallback } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import type { LayoutMode } from "../types";

// Ukuran window
const EXPANDED_SIZE = new LogicalSize(800, 600);
const COMPACT_SIZE = new LogicalSize(480, 180);
const MINI_SIZE = new LogicalSize(260, 80);

/**
 * Hook untuk mengatur ukuran window Tauri dan system tray.
 */
export function useWindowSize(layout: LayoutMode) {
    useEffect(() => {
        try {
            const win = getCurrentWindow();
            const applySize = async () => {
                try {
                    let targetSize: LogicalSize;
                    if (layout === "expanded") targetSize = EXPANDED_SIZE;
                    else if (layout === "compact") targetSize = COMPACT_SIZE;
                    else targetSize = MINI_SIZE;

                    await win.setSize(targetSize);
                } catch (e) {
                    console.error("Gagal mengubah ukuran window:", e);
                }
            };
            applySize();
        } catch {
            // Diabaikan jika tidak di Tauri
        }
    }, [layout]);

    /**
     * Minimize window ke system tray (hide window).
     */
    const minimizeToTray = useCallback(async () => {
        try {
            const win = getCurrentWindow();
            await win.hide();
        } catch {
            // Diabaikan
        }
    }, []);

    /**
     * Update tooltip tray dengan countdown string.
     */
    const updateTrayTooltip = useCallback(async (text: string) => {
        try {
            await invoke("update_tray_tooltip", { tooltip: text });
        } catch {
            // Diabaikan
        }
    }, []);

    return { minimizeToTray, updateTrayTooltip };
}
