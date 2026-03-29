import { useState } from "react";
import { Timer, Target, Clock } from "lucide-react";
import { TimerControls } from "./TimerControls";
import { SlabPixelWidget } from "./SlabPixelWidget";
import type { Mode } from "../types";
import type { SlabPixelData } from "../hooks/useSlabPixelTracker";

interface MergedTimerCardProps {
    timeString: string;
    mode: Mode;
    isActive: boolean;
    msLeft: number;
    totalModeMs: number;
    sessionInCycle: number;
    activeTaskText?: string;
    slabPixel: SlabPixelData;
    showTracker: boolean;
    onToggleTracker: () => void;
    onToggle: () => void;
    onReset: () => void;
    onComplete: () => void;
}

export function MergedTimerCard({
    timeString, mode, isActive, sessionInCycle,
    activeTaskText, slabPixel, showTracker, onToggleTracker,
    onToggle, onReset, onComplete,
}: MergedTimerCardProps) {
    const [tab, setTab] = useState<"pomodoro" | "tracker">("pomodoro");

    return (
        <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                    <Timer size={14} className="text-orange-400" />
                    <span className="card-title">TIMER</span>
                </div>
                <span className={`badge-text px-2 py-0.5 rounded-full text-white ${mode === "focus" ? "bg-orange-500" : "bg-stone-400"}`}>
                    {mode === "focus" ? "FOCUS" : "BREAK"}
                </span>
            </div>

            <div className="border-t border-stone-100 mb-3" />

            {/* Large timer display — Bebas Neue, always stone-800 */}
            <div
                className={`text-[72px] leading-none tracking-wider text-stone-800 text-center mb-1 select-none transition-opacity ${!isActive ? "opacity-60" : ""}`}
                style={{ fontFamily: "var(--font-display)" }}
            >
                {timeString}
            </div>

            {/* 4 cycle dots */}
            <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4].map(n => {
                    let dotClass = "bg-stone-200";
                    if (n < sessionInCycle) {
                        dotClass = "bg-orange-500";
                    } else if (n === sessionInCycle) {
                        dotClass = "bg-orange-400 ring-2 ring-orange-100";
                    }
                    return (
                        <span
                            key={n}
                            className={`w-2 h-2 rounded-full ${dotClass} transition-all`}
                        />
                    );
                })}
            </div>

            {/* Active task row */}
            {activeTaskText && (
                <div className="flex items-center gap-2 mb-3 pl-3 border-l-[3px] border-orange-500 bg-orange-50 py-2 pr-3 rounded-r-lg">
                    <Target size={12} className="text-orange-500 shrink-0" />
                    <span className="task-name truncate max-w-[200px]">{activeTaskText}</span>
                </div>
            )}

            {/* Tab switcher */}
            <div className="flex border-b border-stone-100 mb-3">
                {(["pomodoro", "tracker"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                            tab === t
                                ? "tab-active"
                                : "tab-inactive hover:text-stone-600"
                        }`}
                    >
                        {t === "pomodoro" ? <Timer size={10} /> : <Clock size={10} />}
                        {t === "pomodoro" ? "POMODORO TIMER" : "TIME TRACKER"}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === "pomodoro" ? (
                <div className="flex justify-center py-1">
                    <TimerControls
                        isActive={isActive}
                        layout="expanded"
                        onToggle={onToggle}
                        onReset={onReset}
                        onComplete={onComplete}
                    />
                </div>
            ) : (
                <SlabPixelWidget
                    data={slabPixel}
                    showTracker={showTracker}
                    onToggleTracker={onToggleTracker}
                />
            )}
        </div>
    );
}
