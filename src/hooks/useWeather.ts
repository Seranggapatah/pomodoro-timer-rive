import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface WeatherData {
    temperature: number;
    condition: string;
    icon: string;
    isDay: boolean;
    locationName: string;
    isLoading: boolean;
    error: string | null;
}

// WMO Weather interpretation codes
function getWeatherIcon(code: number | string, isDay: boolean): { icon: string; condition: string; code: number | string } {
    const c = Number(code);
    let icon = "Unknown";
    let condition = "Unknown";

    if (c === 0) { icon = isDay ? "ClearDay" : "ClearNight"; condition = "Clear"; }
    else if (c >= 1 && c <= 3) { icon = "Cloudy"; condition = "Cloudy"; }
    else if (c === 45 || c === 48) { icon = "Fog"; condition = "Fog"; }
    else if (c >= 51 && c <= 57) { icon = "Drizzle"; condition = "Drizzle"; }
    else if (c >= 61 && c <= 67) { icon = "Rain"; condition = "Rain"; }
    else if (c >= 71 && c <= 77) { icon = "Snow"; condition = "Snow"; }
    else if (c >= 80 && c <= 82) { icon = "Showers"; condition = "Showers"; }
    else if (c >= 85 && c <= 86) { icon = "Snow"; condition = "Snow Showers"; }
    else if (c >= 95 && c <= 99) { icon = "Thunderstorm"; condition = "Thunderstorm"; }
    else if (!isNaN(c)) { icon = "Cloudy"; condition = `Code:${c}`; } // Fallback to cloudy if unknown number

    return { icon, condition, code: c };
}

export function useWeather() {
    const [data, setData] = useState<WeatherData>({
        temperature: 0,
        condition: "",
        icon: "",
        isDay: true,
        locationName: "Loading...",
        isLoading: true,
        error: null
    });

    const [cachedData, setCachedData] = useLocalStorage<WeatherData | null>("pomodoro-weather-cache-v3", null);
    const [lastFetch, setLastFetch] = useLocalStorage<number>("pomodoro-weather-last-fetch-v3", 0);

    useEffect(() => {
        let mounted = true;

        async function fetchWeather() {
            // Refresh only every 30 minutes to be light on the API
            const now = Date.now();
            if (cachedData && (now - lastFetch < 30 * 60 * 1000)) {
                setData({ ...cachedData, isLoading: false, error: null });
                return;
            }

            setData(prev => ({ ...prev, isLoading: true, error: null }));

            try {
                // Try getting user's location based on IP first
                let lat = -6.2146;
                let lon = 106.8451;
                let location = "Jakarta";

                try {
                    const locRes = await fetch("https://get.geojs.io/v1/ip/geo.json");
                    if (locRes.ok) {
                        const locData = await locRes.json();
                        if (locData.latitude && locData.longitude) {
                            lat = parseFloat(locData.latitude);
                            lon = parseFloat(locData.longitude);
                            location = locData.city || locData.region || "Local";
                        }
                    }
                } catch (e) {
                    console.warn("Could not determine IP location, using default", e);
                }

                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`);

                if (!res.ok) throw new Error("Failed to fetch weather data");

                const weatherData = await res.json();
                const current = weatherData.current;
                const code = current.weather_code;
                const isDay = current.is_day === 1;

                const { icon, condition } = getWeatherIcon(code, isDay);

                const newWeatherData: WeatherData = {
                    temperature: Math.round(current.temperature_2m),
                    condition,
                    icon,
                    isDay,
                    locationName: location,
                    isLoading: false,
                    error: null
                };

                console.log("[useWeather] Current code:", code, "Mapped icon:", icon);

                if (mounted) {
                    setData(newWeatherData);
                    setCachedData(newWeatherData);
                    setLastFetch(now);
                }
            } catch (error) {
                if (mounted) {
                    if (cachedData) {
                        setData({ ...cachedData, isLoading: false, error: "Using cached weather data" });
                    } else {
                        setData(prev => ({ ...prev, isLoading: false, error: "Failed to load weather" }));
                    }
                }
            }
        }

        fetchWeather();

        // Re-fetch occasionally
        const interval = setInterval(fetchWeather, 30 * 60 * 1000); // 30 mins
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [cachedData, lastFetch, setCachedData, setLastFetch]);

    return data;
}
