import { useEffect } from "react";

interface ShortcutActions {
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onCycleLayout: () => void;
}

/**
 * Hook untuk keyboard shortcuts global.
 *
 * Shortcuts:
 *   Space → Play / Pause timer
 *   R     → Reset timer
 *   E     → Expand / Collapse window
 *
 * Tidak aktif saat user sedang mengetik di input/textarea.
 */
export function useKeyboardShortcuts({
    onToggleTimer,
    onResetTimer,
    onCycleLayout,
}: ShortcutActions) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Abaikan jika sedang mengetik di input field
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            switch (e.code) {
                case "Space":
                    e.preventDefault();
                    onToggleTimer();
                    break;
                case "KeyR":
                    e.preventDefault();
                    onResetTimer();
                    break;
                case "KeyL": // L for Layout cycle
                    e.preventDefault();
                    onCycleLayout();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onToggleTimer, onResetTimer, onCycleLayout]);
}
