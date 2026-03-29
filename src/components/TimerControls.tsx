import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import type { LayoutMode } from "../types";
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface TimerControlsProps {
    isActive: boolean;
    layout: LayoutMode;
    onToggle: () => void;
    onReset: () => void;
    onComplete?: () => void;
}

export function TimerControls({ isActive, layout, onToggle, onReset, onComplete }: TimerControlsProps) {
    const isExpanded = layout === "expanded";
    
    // For mini mode, we keep a tiny button set
    if (!isExpanded) {
        return (
            <div className="flex items-center gap-2">
                <Button variant={isActive ? "secondary" : "default"} size="icon" onClick={onToggle} className="h-6 w-6 rounded-full">
                    {isActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-4">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-stone-200 bg-white text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-all active:scale-95"
                        onClick={onReset}
                    >
                        <RotateCcw size={14} />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Reset Timer</p>
                </TooltipContent>
            </Tooltip>

            <button
                className={`flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-sm active:scale-95 ${isActive ? "bg-orange-600 shadow-orange-600/20" : "bg-orange-500 shadow-orange-500/20 hover:bg-orange-600"}`}
                onClick={onToggle}
            >
                {isActive ? (
                    <Pause size={22} className="text-white" fill="currentColor" />
                ) : (
                    <Play size={22} className="text-white ml-1" fill="currentColor" />
                )}
            </button>

            {onComplete && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center w-10 h-10 rounded-full border border-stone-200 bg-white text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-all active:scale-95"
                            onClick={onComplete}
                        >
                            <SkipForward size={14} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Complete Session & Skip</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
