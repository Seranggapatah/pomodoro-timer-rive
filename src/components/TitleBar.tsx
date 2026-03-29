import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Mode, LayoutMode } from "../types";
import { useWeather } from "../hooks/useWeather";
import { WeatherIcon } from "./WeatherWidget";
import { Cloud, MapPin, Minimize2, LayoutGrid, Maximize2 } from "lucide-react";

interface TitleBarProps {
    mode: Mode;
    layoutMode: LayoutMode;
    isTrackerActive?: boolean;
    onSetLayout: (mode: LayoutMode) => void;
}

export function TitleBar({ mode, layoutMode, isTrackerActive = false, onSetLayout }: TitleBarProps) {
    const weather = useWeather();

    const handleDrag = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        if (e.button === 0) {
            try {
                getCurrentWindow().startDragging();
            } catch {
                // ignored outside Tauri
            }
        }
    };

    return (
        <div
            className="relative flex h-10 w-full items-center justify-between px-4 bg-white border-b border-stone-200 select-none shrink-0"
            data-tauri-drag-region
            onMouseDown={handleDrag}
        >
            {/* LEFT GROUP */}
            <div className="flex items-center gap-3">
                {/* Mode badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${mode === "focus" ? "bg-orange-500" : "bg-orange-500"}`}>
                    {mode.toUpperCase()}
                </span>

                {/* Weather temp */}
                {!weather.isLoading && !weather.error && (
                    <div className="flex items-center gap-3 opacity-60">
                        <div className="flex items-center gap-1">
                            <Cloud size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-500 font-medium">{weather.temperature}°C</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-500 uppercase font-medium">{weather.locationName || "SLEMAN"}</span>
                        </div>

                        {/* Divider */}
                        <div className="h-3 w-px bg-stone-200" />

                        {/* Condition */}
                        <div className="flex items-center gap-1">
                            <WeatherIcon iconKey={weather.icon} className="text-stone-400" />
                            <span className="text-xs text-stone-400 uppercase font-medium">{weather.condition || "SHOWERS"}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* CENTER — syncing status */}
            <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 transition-opacity duration-300 ${isTrackerActive ? "opacity-100" : "opacity-0 invisible"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                <span className="text-[10px] tracking-[0.2em] font-bold text-orange-400">
                    SYNCING
                </span>
            </div>

            {/* RIGHT GROUP — layout icon buttons */}
            <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                <button
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${layoutMode === "mini" ? "bg-orange-500 text-white" : "text-stone-400 hover:bg-stone-100"}`}
                    onClick={() => onSetLayout("mini")}
                    title="Minimal"
                >
                    <Minimize2 size={14} />
                </button>
                <button
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${layoutMode === "compact" ? "bg-orange-500 text-white" : "text-stone-400 hover:bg-stone-100"}`}
                    onClick={() => onSetLayout("compact")}
                    title="Compact"
                >
                    <LayoutGrid size={14} />
                </button>
                <button
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${layoutMode === "expanded" ? "bg-orange-500 text-white" : "text-stone-400 hover:bg-stone-100"}`}
                    onClick={() => onSetLayout("expanded")}
                    title="Expanded"
                >
                    <Maximize2 size={14} />
                </button>
            </div>
        </div>
    );
}
