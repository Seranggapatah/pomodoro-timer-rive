import { useState } from "react";
import { RefreshCw, LogIn, LogOut, Clock, Pause, Play, Square, AlertTriangle } from "lucide-react";
import type { SlabPixelData } from "../hooks/useSlabPixelTracker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SlabPixelWidgetProps {
    data: SlabPixelData;
    showTracker?: boolean;
    onToggleTracker?: () => void;
}

export function SlabPixelWidget({ data, showTracker, onToggleTracker }: SlabPixelWidgetProps) {
    const {
        trackerTime, paused, stopped, isLoading, error,
        refresh, startTimer, pauseTimer, initiateStop, confirmStop, cancelStop,
        openLogin, closeLogin,
    } = data;

    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [stopping, setStopping] = useState(false);

    const isNotLoggedIn =
        error?.includes("Make sure you are logged in") ||
        error?.includes("Not found on");

    const handleInitiateStop = async () => {
        setShowStopConfirm(true);
        await initiateStop();
    };

    const handleConfirmStop = async () => {
        setStopping(true);
        await confirmStop();
        setStopping(false);
        setShowStopConfirm(false);
    };

    const handleCancelStop = async () => {
        await cancelStop();
        setShowStopConfirm(false);
    };

    return (
        <div className={`flex flex-col p-4 gap-0 border rounded-xl bg-white w-full transition-colors overflow-hidden shrink-0 ${showTracker ? "border-orange-400" : "border-stone-200"}`}>
            <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-orange-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">TIME TRACKER</span>
                </div>
                <div className="flex items-center gap-2">
                    {onToggleTracker && (
                        <Button
                            variant={showTracker ? "default" : "outline"}
                            size="sm"
                            className="h-6 text-[10px] uppercase font-bold tracking-widest px-2"
                            onClick={onToggleTracker}
                            title="Toggle Inline Tracker"
                        >
                            TRK
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                        onClick={refresh}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>
            <Separator className="my-0" />
            <div className="flex flex-col gap-2 mt-3">

            {/* Error / Not logged in */}
            {error && (
                <div className="flex flex-col gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <span className="text-xs font-bold text-destructive flex items-center gap-2">
                        <AlertTriangle size={12} />
                        {isNotLoggedIn ? "Not logged in" : error}
                    </span>
                    {isNotLoggedIn && (
                        <div className="flex items-center gap-2 mt-1">
                            <Button size="sm" variant="default" className="text-[10px] h-7" onClick={openLogin}>
                                <LogIn size={10} className="mr-1.5" /> Open Login
                            </Button>
                            <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={closeLogin}>
                                <LogOut size={10} className="mr-1.5" /> Done
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Time display */}
            {!error && (
                <div className="flex flex-col items-center justify-center py-4 bg-stone-50 border border-stone-200/50 rounded-xl">
                    {isLoading && !trackerTime ? (
                        <span className="text-[10px] uppercase font-medium tracking-wide text-stone-400 animate-pulse">loading...</span>
                    ) : (
                        <span className={`text-4xl font-bold font-mono tracking-tight transition-opacity ${paused ? "opacity-50 text-stone-500" : "text-stone-800"}`}>
                            {stopping ? "stopping..." : (trackerTime ?? "—")}
                        </span>
                    )}
                    {paused && !stopped && trackerTime && (
                        <span className="bg-amber-500/10 text-amber-500 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full mt-2">PAUSED</span>
                    )}
                </div>
            )}

            {/* Pause / Stop controls */}
            {trackerTime && !error && !showStopConfirm && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                    {stopped ? (
                        <Button
                            onClick={startTimer}
                            variant="default"
                            className="col-span-2 w-full font-bold uppercase tracking-widest text-xs"
                        >
                            <Play size={12} className="mr-2 fill-current" /> Start
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant={paused ? "default" : "secondary"}
                                onClick={pauseTimer}
                                className="w-full text-xs font-bold uppercase tracking-widest"
                            >
                                {paused ? <Play size={10} className="mr-2 fill-current" /> : <Pause size={10} className="mr-2 fill-current" />}
                                {paused ? "Resume" : "Pause"}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleInitiateStop}
                                disabled={stopping}
                                className="w-full text-xs font-bold uppercase tracking-widest"
                            >
                                <Square size={10} className="mr-2 fill-current" />
                                Stop
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Stop confirmation */}
            {showStopConfirm && (
                <div className="flex flex-col gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-1 animate-in slide-in-from-bottom-2 fade-in relative overflow-hidden">
                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                        <AlertTriangle size={14} className="shrink-0 animate-pulse" />
                        Stop the tracker?
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1 z-10">
                        <Button
                            variant="destructive"
                            onClick={handleConfirmStop}
                            className="font-bold text-[10px] uppercase tracking-widest"
                        >
                            <Square size={10} className="mr-2 fill-current" />
                            Yes, Stop
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancelStop}
                            className="font-bold text-[10px] uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
            
            <Separator className="my-2" />
            <div className="text-center text-[9px] text-stone-400 uppercase font-medium tracking-widest">
                powered by slabpixel.com
            </div>
        </div>
      </div>
    );
}
