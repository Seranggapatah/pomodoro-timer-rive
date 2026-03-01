import type { ThemeName } from "../types";

interface ThemeSelectorProps {
    currentTheme: ThemeName;
    onSelectTheme: (theme: ThemeName) => void;
}

const THEME_OPTIONS: { name: ThemeName; label: string }[] = [
    { name: "green", label: "grn" },
    { name: "amber", label: "amb" },
    { name: "cyan", label: "cyn" },
    { name: "pink", label: "pnk" },
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
