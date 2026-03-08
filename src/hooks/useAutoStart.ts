import { useState, useEffect, useCallback } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

export function useAutoStart() {
    const [isAutoStartOnLogin, setIsAutoStartOnLogin] = useState(false);

    useEffect(() => {
        const checkAutoStart = async () => {
            try {
                const enabled = await isEnabled();
                setIsAutoStartOnLogin(enabled);
            } catch (e) {
                console.error("Failed to fetch autostart status:", e);
            }
        };
        checkAutoStart();
    }, []);

    const toggleAutoStartOnLogin = useCallback(async () => {
        try {
            if (isAutoStartOnLogin) {
                await disable();
                setIsAutoStartOnLogin(false);
            } else {
                await enable();
                setIsAutoStartOnLogin(true);
            }
        } catch (e) {
            console.error("Failed to toggle autostart:", e);
        }
    }, [isAutoStartOnLogin]);

    return { isAutoStartOnLogin, toggleAutoStartOnLogin };
}
