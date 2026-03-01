import { useEffect } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

// Ukuran window untuk masing-masing mode layout
const EXPANDED_SIZE = new LogicalSize(800, 540);
const COMPACT_SIZE = new LogicalSize(480, 180);

/**
 * Hook untuk mengatur ukuran window Tauri secara programmatik.
 * Dipanggil setiap kali `isExpanded` berubah.
 */
export function useWindowSize(isExpanded: boolean) {
    useEffect(() => {
        try {
            const win = getCurrentWindow();

            const applySize = async () => {
                try {
                    const targetSize = isExpanded ? EXPANDED_SIZE : COMPACT_SIZE;
                    await win.setSize(targetSize);
                } catch (e) {
                    console.error("Gagal mengubah ukuran window:", e);
                }
            };

            applySize();
        } catch {
            // Diabaikan jika tidak di environment Tauri (misal: browser biasa)
        }
    }, [isExpanded]);
}
