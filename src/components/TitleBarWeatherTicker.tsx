import React, { useState, useEffect } from "react";
import { useWeather } from "../hooks/useWeather";
import { AnimatedAsciiIcon } from "./WeatherWidget";
import type { LayoutMode } from "../types";
import "./TitleBarWeatherTicker.css";

interface Props {
    layoutMode: LayoutMode;
}

export const TitleBarWeatherTicker: React.FC<Props> = ({ layoutMode }) => {
    const weather = useWeather();
    const [tick, setTick] = useState(0);

    // Swap content every 8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setTick((prev) => (prev === 0 ? 1 : 0));
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // Don't render until loaded
    if (weather.isLoading && !weather.temperature) return null;

    // Minimal error state
    if (weather.error && !weather.temperature) return null;

    // Abbreviate location name in compact mode (e.g. "JAKARTA" -> "JAK")
    let displayLoc = weather.locationName?.toUpperCase() || "UNK";
    if (layoutMode === "compact" && displayLoc.length > 3) {
        // Strip vowels to make an acronym, or just take first 3 chars
        displayLoc = displayLoc.substring(0, 3);
    }

    return (
        <div className="titlebar-ticker-container">
            <span className="titlebar-sep">·</span>
            <div className="titlebar-ticker-viewport">
                <div className={`titlebar-ticker-track index-${tick}`}>
                    <div className="titlebar-ticker-item">
                        <AnimatedAsciiIcon iconKey={weather.icon} />
                        <span style={{ marginLeft: "4px" }}>{weather.temperature}°C</span>
                    </div>
                    <div className="titlebar-ticker-item">
                        <span className="ticker-location">[{displayLoc}]</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
