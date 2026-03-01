import { useLocalStorage } from "./useLocalStorage";

/**
 * Hook untuk menyimpan catatan pengguna ke localStorage.
 */
export function useNotes() {
    const [note, setNote] = useLocalStorage<string>("pomodoro-note", "");
    return { note, setNote };
}
