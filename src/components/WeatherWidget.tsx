import React from 'react';
import { useWeather } from '../hooks/useWeather';
import { Sun, Moon, Cloud, CloudFog, CloudDrizzle, CloudRain, Snowflake, CloudLightning, HelpCircle, Loader2, CloudOff, MapPin } from "lucide-react";
import type { LayoutMode } from '../types';

export const WeatherIcon = ({ iconKey, className }: { iconKey: string, className?: string }) => {
    switch (iconKey) {
        case "ClearDay": return <Sun size={14} className={className} />;
        case "ClearNight": return <Moon size={14} className={className} />;
        case "Cloudy": return <Cloud size={14} className={className} />;
        case "Fog": return <CloudFog size={14} className={className} />;
        case "Drizzle": return <CloudDrizzle size={14} className={className} />;
        case "Rain": return <CloudRain size={14} className={className} />;
        case "Snow": return <Snowflake size={14} className={className} />;
        case "Showers": return <CloudRain size={14} className={className} />;
        case "Thunderstorm": return <CloudLightning size={14} className={className} />;
        default: return <HelpCircle size={14} className={className} />;
    }
};

interface WeatherWidgetProps {
    layoutMode: LayoutMode;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ layoutMode }) => {
    const weather = useWeather();

    if (layoutMode === "mini") {
        return null;
    }

    return (
        <div className="flex items-center gap-3">
            {weather.isLoading ? (
                <div className="flex items-center gap-1.5 text-stone-400">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-[10px] uppercase font-medium tracking-widest text-stone-500">Loading...</span>
                </div>
            ) : weather.error && !weather.temperature ? (
                <div className="flex items-center gap-1.5 text-red-400">
                    <CloudOff size={12} />
                    <span className="text-[10px] uppercase font-medium tracking-widest">Offline</span>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-1">
                        <Cloud size={12} className="text-stone-400" />
                        <span className="text-xs text-stone-300">{weather.temperature}°C</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-stone-600" />
                    <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-stone-400" />
                        <span className="text-xs text-stone-300 uppercase">{weather.locationName}</span>
                    </div>
                </>
            )}
        </div>
    );
};
