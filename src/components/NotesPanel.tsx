interface NotesPanelProps {
    note: string;
    onNoteChange: (text: string) => void;
}

/**
 * Panel catatan terminal-style dengan textarea.
 * Teks otomatis tersimpan di localStorage.
 */
export function NotesPanel({ note, onNoteChange }: NotesPanelProps) {
    return (
        <div className="notes-panel">
            <div className="notes-title">&gt; notes</div>
            <textarea
                className="notes-textarea"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Type your notes here..."
                rows={4}
                spellCheck={false}
            />
        </div>
    );
}
