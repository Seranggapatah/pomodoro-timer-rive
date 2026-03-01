/**
 * Mode timer: fokus kerja atau istirahat.
 */
export type Mode = "focus" | "break";

/**
 * Struktur data untuk satu item task.
 */
export interface Task {
    id: string;
    text: string;
    completed: boolean;
}
