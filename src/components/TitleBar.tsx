import { useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Mode, LayoutMode } from "../types";

interface TitleBarProps {
    mode: Mode;
    layoutMode: LayoutMode;
    isActive: boolean;
    onSetLayout: (mode: LayoutMode) => void;
}

/**
 * Title bar terminal-style: label kiri, status tengah, layout buttons kanan.
 * Status indicator blink saat timer running — semua dalam satu baris.
 */
export function TitleBar({ mode, layoutMode, isActive, onSetLayout }: TitleBarProps) {
    const pidRef = useRef(4096 + Math.floor(Math.random() * 9000));

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
        <div className="titlebar" data-tauri-drag-region onMouseDown={handleDrag}>
            <span className="titlebar-label">
                {mode === "focus" ? "focus_session" : "break_time"}
            </span>

            {/* Status inline di tengah titlebar */}
            <div className={`titlebar-status${isActive ? " running" : ""}`}>
                <span className={`status-indicator${isActive ? " running" : ""}`}>
                    {isActive ? "●" : "○"}
                </span>
                <span className="status-text">
                    {isActive ? "process_running" : "awaiting_input"}
                </span>
                <span className="status-sep">·</span>
                <span className="status-pid">pid:{pidRef.current}</span>
            </div>

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
