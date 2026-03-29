import { Textarea } from "@/components/ui/textarea";
import { StickyNote, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface NotesPanelProps {
    note: string;
    onNoteChange: (text: string) => void;
}

export function NotesPanel({ note, onNoteChange }: NotesPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("pomodoro-notes-collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem("pomodoro-notes-collapsed", String(next));
    };

    return (
        <div className="flex flex-col border border-stone-200 rounded-xl bg-white w-full overflow-hidden transition-all duration-300">
            {/* Header: exactly 44px (h-11) */}
            <button 
                onClick={toggleCollapse}
                className="flex items-center justify-between px-4 h-11 w-full cursor-pointer group active:bg-stone-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <StickyNote size={14} className="text-orange-400" />
                    <span className="card-title">NOTES & SCRATCHPAD</span>
                </div>
                <ChevronRight size={14} className={`text-stone-300 transition-transform duration-200 ${!isCollapsed ? "rotate-90" : "rotate-0"}`} />
            </button>
            
            <div className={`grid transition-all duration-300 ease-in-out ${isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
                <div className="overflow-hidden">
                    <div className="px-4 pb-4">
                        <div className="section-divider" />
                        <Textarea
                            className="w-full bg-stone-50/50 resize-none border-dashed border-stone-200 focus-visible:ring-1 text-xs text-stone-500 font-medium p-3 leading-relaxed min-h-[120px]"
                            value={note}
                            onChange={(e) => onNoteChange(e.target.value)}
                            placeholder="Jot down quick thoughts..."
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
