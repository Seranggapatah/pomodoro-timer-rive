import { create } from "zustand";
import { persist } from "zustand/middleware";

function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

interface NotesState {
    note: string;
    setNote: (v: string) => void;
}

export const useNotesStore = create<NotesState>()(
    persist(
        (set) => ({
            note: readLS("pomodoro-note", ""),
            setNote: (v) => set({ note: v }),
        }),
        { name: "pomodoro-notes-store" }
    )
);
