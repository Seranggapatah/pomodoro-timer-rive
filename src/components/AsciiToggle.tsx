import { useState, useRef, useEffect } from "react";
import type { AsciiCharset } from "../hooks/useAsciiFilter";
import { ASCII_COLORS } from "../hooks/useAsciiFilter";

export interface AsciiSettings {
    enabled: boolean;
    charset: AsciiCharset;
    color: string;
    charSize: number;
    opacity: number;
    colorBlend: number; // 0 = pure source color, 1 = pure tint color
}

interface AsciiToggleProps {
    settings: AsciiSettings;
    onChange: (patch: Partial<AsciiSettings>) => void;
}

const CHARSETS: { key: AsciiCharset; label: string; preview: string }[] = [
    { key: "detailed", label: "Detailed", preview: ".:-=+*#%@" },
    { key: "simple", label: "Simple", preview: ". : # @" },
    { key: "blocks", label: "Blocks", preview: "░▒▓█" },
    { key: "matrix", label: "Matrix", preview: "I O C A" },
];

export function AsciiToggle({ settings, onChange }: AsciiToggleProps) {
    const [panelOpen, setPanelOpen] = useState(false);
    const { enabled, charset, color, charSize, opacity, colorBlend } = settings;

    // Anchor ref — the CFG button — used to position the panel
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [panelPos, setPanelPos] = useState({ left: 0, bottom: 0 });

    useEffect(() => {
        if (panelOpen && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPanelPos({
                left: rect.left,
                bottom: window.innerHeight - rect.top + 6,
            });
        }
    }, [panelOpen]);

    return (
        <div className="ascii-widget">
            {/* ── Row 1: toggle + gear ───────────────────── */}
            <div className="ascii-toprow">
                <button
                    id="ascii-toggle-btn"
                    className={`ascii-toggle-btn ${enabled ? "active" : ""}`}
                    onClick={() => onChange({ enabled: !enabled })}
                    title={enabled ? "Disable ASCII filter" : "Enable ASCII filter"}
                >
                    <span className="ascii-toggle-icon">Ａ</span>
                    <span className="ascii-toggle-label">ASCII</span>
                </button>

                {enabled && (
                    <button
                        ref={anchorRef}
                        id="ascii-settings-btn"
                        className={`ascii-gear-btn ${panelOpen ? "open" : ""}`}
                        onClick={() => setPanelOpen(v => !v)}
                        title="ASCII settings"
                    >
                        {panelOpen ? "▲" : "▼"} CFG
                    </button>
                )}
            </div>

            {/* ── Panel: fixed-position to escape any overflow clip ── */}
            {enabled && panelOpen && (
                <div
                    className="ascii-panel"
                    style={{
                        position: "fixed",
                        left: panelPos.left,
                        bottom: panelPos.bottom,
                        top: "auto",
                    }}
                >

                    {/* Charset */}
                    <div className="ascii-row">
                        <span className="ascii-row-label">CHARSET</span>
                        <div className="ascii-charset-grid">
                            {CHARSETS.map(c => (
                                <button
                                    key={c.key}
                                    className={`ascii-charset-cell ${charset === c.key ? "active" : ""}`}
                                    onClick={() => onChange({ charset: c.key })}
                                    title={c.label}
                                >
                                    <span className="ascii-cell-preview">{c.preview}</span>
                                    <span className="ascii-cell-label">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color swatches */}
                    <div className="ascii-row">
                        <span className="ascii-row-label">COLOR</span>
                        <div className="ascii-color-row">
                            {ASCII_COLORS.map(c => (
                                <button
                                    key={c}
                                    className={`ascii-swatch ${color === c ? "active" : ""}`}
                                    style={{ background: c, boxShadow: color === c ? `0 0 8px ${c}` : "none" }}
                                    onClick={() => onChange({ color: c })}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Char size */}
                    <div className="ascii-row">
                        <span className="ascii-row-label">SIZE</span>
                        <div className="ascii-slider-wrap">
                            <input
                                id="ascii-charsize-slider"
                                type="range"
                                min={3}
                                max={14}
                                step={1}
                                value={charSize}
                                onChange={e => onChange({ charSize: Number(e.target.value) })}
                                className="ascii-slider"
                            />
                            <span className="ascii-slider-val">{charSize}px</span>
                        </div>
                        <span className="ascii-hint">small ← → large</span>
                    </div>

                    {/* Opacity */}
                    <div className="ascii-row">
                        <span className="ascii-row-label">OPACITY</span>
                        <div className="ascii-slider-wrap">
                            <input
                                id="ascii-opacity-slider"
                                type="range"
                                min={20}
                                max={100}
                                step={5}
                                value={Math.round(opacity * 100)}
                                onChange={e => onChange({ opacity: Number(e.target.value) / 100 })}
                                className="ascii-slider"
                            />
                            <span className="ascii-slider-val">{Math.round(opacity * 100)}%</span>
                        </div>
                    </div>

                    {/* Color blend */}
                    <div className="ascii-row">
                        <span className="ascii-row-label">TINT</span>
                        <div className="ascii-slider-wrap">
                            <input
                                id="ascii-blend-slider"
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={Math.round(colorBlend * 100)}
                                onChange={e => onChange({ colorBlend: Number(e.target.value) / 100 })}
                                className="ascii-slider"
                            />
                            <span className="ascii-slider-val">{Math.round(colorBlend * 100)}%</span>
                        </div>
                        <span className="ascii-hint">src ← → tint</span>
                    </div>

                    {/* Reset */}
                    <button
                        className="ascii-reset-btn"
                        onClick={() => onChange({
                            charset: "detailed",
                            color: "#00ff88",
                            charSize: 7,
                            opacity: 0.9,
                            colorBlend: 0.65,
                        })}
                    >
                        ↺ RESET
                    </button>
                </div>
            )}
        </div>
    );
}
