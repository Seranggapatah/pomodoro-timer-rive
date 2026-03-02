import type { ThemeName } from "../types";

interface ThemeSelectorProps {
    currentTheme: ThemeName;
    onSelectTheme: (theme: ThemeName) => void;
}

const THEME_OPTIONS: { name: ThemeName; label: string }[] = [
    { name: "matrix", label: "mtx" },
    { name: "cyberpunk", label: "cyb" },
    { name: "nord", label: "nrd" },
    { name: "dracula", label: "drc" },
    { name: "catppuccin", label: "cat" },
    { name: "outrun", label: "out" },
    { name: "monochrome", label: "mon" },
];

/**
 * Selector tema terminal: 4 tombol kecil untuk memilih warna.
 */
export function ThemeSelector({ currentTheme, onSelectTheme }: ThemeSelectorProps) {
    return (
        <div className="theme-selector">
            <span className="theme-selector-label">&gt; theme:</span>
            {THEME_OPTIONS.map((t) => (
                <button
                    key={t.name}
                    onClick={() => onSelectTheme(t.name)}
                    className={`theme-btn theme-btn-${t.name} ${currentTheme === t.name ? "active" : ""}`}
                >
                    [{t.label}]
                </button>
            ))}
        </div>
    );
}
