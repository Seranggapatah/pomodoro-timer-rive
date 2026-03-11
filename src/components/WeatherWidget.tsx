import React, { useState, useEffect } from 'react';
import { useWeather } from '../hooks/useWeather';
import './WeatherWidget.css';
import type { LayoutMode } from '../types';

const WEATHER_FRAMES: Record<string, string[]> = {
    ClearDay: ["\\O/", "-O-", "/O\\", "|O|"],
    ClearNight: ["c *", "* c", "c  ", " *c"],
    Cloudy: ["(--)", "(--)", "(--)", "(--)"],
    Fog: ["- -", " - ", "- -", " - "],
    Drizzle: [" , ", ", ,", " , ", ", ,"],
    Rain: ["///", "|||", "\\\\\\", "|||"],
    Snow: [" * ", "* *", " * ", "** "],
    Showers: ["// ", " //", "// ", " //"],
    Thunderstorm: ["_Z_", "~Z~", "-Z-", " Z "],
    Unknown: ["?_?", " ? ", "?_?", " ? "]
};

export const AnimatedAsciiIcon = ({ iconKey }: { iconKey: string }) => {
    const [frameIndex, setFrameIndex] = useState(0);
    const frames = WEATHER_FRAMES[iconKey] || WEATHER_FRAMES.Unknown;

    useEffect(() => {
        const interval = setInterval(() => {
            setFrameIndex((prev) => (prev + 1) % frames.length);
        }, 400);
        return () => clearInterval(interval);
    }, [frames]);

    return <span className="weather-icon" title={`Key: ${iconKey}`}>{frames[frameIndex]}</span>;
};

interface WeatherWidgetProps {
    layoutMode: LayoutMode;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ layoutMode }) => {
    const weather = useWeather();

    if (layoutMode === "mini") {
        // Mini mode might not have space for weather, but we can show a tiny icon if we want
        // We'll return null to keep mini mode clean
        return null;
    }

    return (
        <div className={`weather-widget ${layoutMode}`} title={`${weather.locationName} - ${weather.condition}`}>
            {weather.isLoading ? (
                <span className="weather-loading">skymap_init...</span>
            ) : weather.error && !weather.temperature ? (
                <span className="weather-error">[weather: OFFLINE]</span>
            ) : (
                <>
                    <AnimatedAsciiIcon iconKey={weather.icon} />
                    <span className="weather-temp">{weather.temperature}°C</span>
                    {layoutMode === "expanded" && (
                        <span className="weather-loc">[{weather.locationName?.toUpperCase()}]</span>
                    )}
                </>
            )}
        </div>
    );
};
