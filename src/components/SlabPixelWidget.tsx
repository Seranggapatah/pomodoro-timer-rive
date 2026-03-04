import { useState } from "react";
import { RefreshCw, LogIn, LogOut, Clock, Pause, Play, Square, AlertTriangle } from "lucide-react";
import type { SlabPixelData } from "../hooks/useSlabPixelTracker";

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

    // Step 1: user clicks the Stop button in Pomotchi
    const handleInitiateStop = async () => {
        setShowStopConfirm(true);
        await initiateStop(); // Clicks "Stop" on SlabPixel, this should open their confirm popup
    };

    // Step 2: user clicks "Yes, Stop Session" in Pomotchi's confirm widget
    const handleConfirmStop = async () => {
        setStopping(true);
        await confirmStop(); // Clicks "Yes, Stop" on SlabPixel's popup
        setStopping(false);
        setShowStopConfirm(false);
    };

    // Step 2 alternative: user clicks Cancel in Pomotchi
    const handleCancelStop = async () => {
        await cancelStop(); // Clicks "Cancel" on SlabPixel's popup just in case it's open
        setShowStopConfirm(false);
    };

    return (
        <div className={`slabpixel-widget ${showTracker ? "active" : ""}`}>
            {/* Header */}
            <div className="slabpixel-header">
                <span className="slabpixel-label">
                    <Clock size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    TIME TRACKER
                </span>
                <div className="slabpixel-actions">
                    {onToggleTracker && (
                        <button
                            className={`slabpixel-btn ${showTracker ? "active" : ""}`}
                            onClick={onToggleTracker}
                            title="Toggle Inline Tracker"
                            style={{ fontFamily: "monospace", fontSize: "10px", lineHeight: 1 }}
                        >
                            [trk]
                        </button>
                    )}
                    <button
                        className="slabpixel-btn"
                        onClick={refresh}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        <RefreshCw size={10} className={isLoading ? "slabpixel-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Error / Not logged in */}
            {error && (
                <div className="slabpixel-error">
                    <span className="slabpixel-error-text">
                        {isNotLoggedIn ? "Not logged in" : error}
                    </span>
                    {isNotLoggedIn && (
                        <div className="slabpixel-login-row">
                            <button className="slabpixel-login-btn" onClick={openLogin}>
                                <LogIn size={10} /> Open Login
                            </button>
                            <button className="slabpixel-login-btn secondary" onClick={closeLogin}>
                                <LogOut size={10} /> Done
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Time display */}
            {!error && (
                <div className="slabpixel-time">
                    {isLoading && !trackerTime ? (
                        <span className="slabpixel-loading">loading…</span>
                    ) : (
                        <span className={`slabpixel-time-value${paused ? " paused" : ""}`}>
                            {stopping ? "stopping…" : (trackerTime ?? "—")}
                        </span>
                    )}
                    {paused && !stopped && trackerTime && (
                        <span className="slabpixel-paused-badge">PAUSED</span>
                    )}
                </div>
            )}

            {/* Pause / Stop controls */}
            {trackerTime && !error && !showStopConfirm && (
                <div className="slabpixel-controls">
                    {stopped ? (
                        <button
                            className="slabpixel-ctrl-btn resume"
                            onClick={startTimer}
                            title="Start tracker"
                        >
                            <Play size={11} /> Start
                        </button>
                    ) : (
                        <>
                            <button
                                className={`slabpixel-ctrl-btn ${paused ? "resume" : "pause"}`}
                                onClick={pauseTimer}
                                title={paused ? "Resume tracker" : "Pause tracker"}
                            >
                                {paused ? <Play size={11} /> : <Pause size={11} />}
                                {paused ? "Resume" : "Pause"}
                            </button>
                            <button
                                className="slabpixel-ctrl-btn stop"
                                onClick={handleInitiateStop}
                                title="Stop tracker"
                                disabled={stopping}
                            >
                                <Square size={11} />
                                Stop
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Stop confirmation */}
            {showStopConfirm && (
                <div className="slabpixel-confirm">
                    <div className="slabpixel-confirm-text">
                        <AlertTriangle size={11} style={{ color: "#ff4545", flexShrink: 0 }} />
                        Stop the tracker?
                    </div>
                    <div className="slabpixel-confirm-buttons">
                        <button
                            className="slabpixel-ctrl-btn stop"
                            onClick={handleConfirmStop}
                        >
                            <Square size={11} />
                            Yes, Stop Session
                        </button>
                        <button
                            className="slabpixel-ctrl-btn"
                            onClick={handleCancelStop}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="slabpixel-source">slabpixel.com</div>
        </div>
    );
}
