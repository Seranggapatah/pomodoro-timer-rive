import { useState, useEffect } from "react";

/**
 * Hook generik untuk menyimpan state ke localStorage.
 * Data otomatis ter-load saat pertama kali dan ter-save setiap kali berubah.
 *
 * @param key   - Kunci localStorage (misal: "pomodoro-tasks")
 * @param defaultValue - Nilai default jika belum ada data tersimpan
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? (JSON.parse(stored) as T) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    // Simpan ke localStorage setiap kali value berubah
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Diabaikan jika localStorage penuh atau tidak tersedia
        }
    }, [key, value]);

    return [value, setValue] as const;
}
