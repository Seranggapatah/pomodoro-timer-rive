import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Mode } from "../types";

interface TitleBarProps {
    mode: Mode;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

/**
 * Title bar terminal-style: menampilkan mode dan tombol expand.
 * Berfungsi juga sebagai drag region untuk menggeser window.
 */
export function TitleBar({ mode, isExpanded, onToggleExpand }: TitleBarProps) {
    const handleDrag = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        if (e.button === 0) {
            try {
                getCurrentWindow().startDragging();
            } catch {
                // Diabaikan jika bukan di Tauri
            }
        }
    };

    return (
        <div
            className="titlebar"
            data-tauri-drag-region
            onMouseDown={handleDrag}
        >
            <span className="titlebar-label">
                {mode === "focus" ? "focus_session" : "break_time"}
            </span>

            <button
                className="titlebar-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onToggleExpand}
            >
                {isExpanded ? "[ - ]" : "[ + ]"}
            </button>
        </div>
    );
}
