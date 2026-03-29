import React, { useState, useEffect } from "react";
import { useWeather } from "../hooks/useWeather";
import { WeatherIcon } from "./WeatherWidget";
import { CloudOff, Loader2 } from "lucide-react";

export const TitleBarWeatherTicker: React.FC = () => {
    const weather = useWeather();
    const [tick, setTick] = useState(0);

    const tickerItems = [
        <div key="loc" className="flex items-center gap-1.5 opacity-90">
            <span className="font-bold text-[10px] tracking-widest uppercase">Location</span>
            <span className="text-xs uppercase tracking-widest">{weather.locationName}</span>
        </div>,
        <div key="cond" className="flex items-center gap-1.5 opacity-90">
            <span className="font-bold text-[10px] tracking-widest uppercase">Cond</span>
            <span className="text-xs uppercase tracking-widest flex items-center gap-1.5">
                <WeatherIcon iconKey={weather.icon} />
                {weather.condition}
            </span>
        </div>,
        <div key="temp" className="flex items-center gap-1.5 opacity-90">
            <span className="font-bold text-[10px] tracking-widest uppercase">Temp</span>
            <span className="text-xs uppercase tracking-widest">{weather.temperature}°C</span>
        </div>
    ];

    useEffect(() => {
        const idx = setInterval(() => {
            setTick((prev) => (prev + 1) % tickerItems.length);
        }, 5000);
        return () => clearInterval(idx);
    }, [tickerItems.length]);

    return (
        <div className="flex items-center gap-2 text-muted-foreground mr-1 h-full px-2">
            {weather.isLoading ? (
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest opacity-60">
                    <Loader2 size={10} className="animate-spin" /> SKY_INIT
                </div>
            ) : weather.error ? (
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-destructive opacity-80">
                    <CloudOff size={10} /> OFFLINE
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden flex items-center min-w-[120px]">
                    {tickerItems[tick]}
                </div>
            )}
        </div>
    );
};
