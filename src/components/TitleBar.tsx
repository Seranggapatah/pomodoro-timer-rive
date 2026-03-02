import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Mode, LayoutMode } from "../types";

interface TitleBarProps {
    mode: Mode;
    layoutMode: LayoutMode;
    onSetLayout: (mode: LayoutMode) => void;
}

/**
 * Title bar terminal-style: menampilkan mode dan 3 tombol layout (mini, compact, expand).
 * Berfungsi juga sebagai drag region untuk menggeser window.
 */
export function TitleBar({ mode, layoutMode, onSetLayout }: TitleBarProps) {
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

            <div className="titlebar-controls" onMouseDown={(e) => e.stopPropagation()}>
                <button
                    className={`titlebar-btn ${layoutMode === "mini" ? "active" : ""}`}
                    onClick={() => onSetLayout("mini")}
                    title="Mini Mode"
                >[min]</button>
                <button
                    className={`titlebar-btn ${layoutMode === "compact" ? "active" : ""}`}
                    onClick={() => onSetLayout("compact")}
                    title="Compact Mode"
                >[cmp]</button>
                <button
                    className={`titlebar-btn ${layoutMode === "expanded" ? "active" : ""}`}
                    onClick={() => onSetLayout("expanded")}
                    title="Expanded Mode"
                >[max]</button>
            </div>
        </div>
    );
}
