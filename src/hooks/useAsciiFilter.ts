/** Colors cycling list for ASCII tint */
export const ASCII_COLORS = ["#00ff88", "#00cfff", "#ff6ef7", "#ffd700", "#ff4444"];

/**
 * ASCII character sets ordered from dark (sparse) → bright (dense).
 * Low luminance pixel → early character (sparse/light symbol)
 * High luminance pixel → later character (dense/heavy symbol)
 */
const ASCII_CHARS = {
    detailed: " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@",
    simple: " .:-=+*#%@",
    blocks: " ░▒▓█",
    matrix: " .:!|IOCA@",
} as const;

export type AsciiCharset = keyof typeof ASCII_CHARS;

export interface AsciiFilterOptions {
    charSize?: number;
    charset?: AsciiCharset;
    /** CSS hex color like "#00ff88" */
    color?: string;
    opacity?: number;
    /** 0 = use source pixel color, 1 = use full tint color (default 0.65) */
    colorBlend?: number;
    enabled?: boolean;
}

import { useEffect, useRef, useCallback } from "react";

export function useAsciiFilter(options: AsciiFilterOptions = {}) {
    const {
        charSize = 6,
        charset = "detailed",
        color = "#00ff88",
        opacity = 0.92,
        colorBlend = 0.65,
        enabled = true,
    } = options;

    const overlayRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const offscreenRef = useRef<HTMLCanvasElement | null>(null);

    // Fallback rain state
    const rainRef = useRef<number[]>([]);
    const pixelSupportedRef = useRef<boolean | null>(null); // null = not tested yet

    const chars = ASCII_CHARS[charset];

    // Parse hex → rgb once
    const parseColor = useCallback((hex: string) => {
        const h = hex.replace("#", "");
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16),
        ] as [number, number, number];
    }, []);

    // Closure for colorBlend used in renderAsciiFromPixels
    const colorBlendRef = useRef(colorBlend);
    colorBlendRef.current = colorBlend;

    const renderFrame = useCallback(() => {
        const overlay = overlayRef.current;
        const container = containerRef.current;
        if (!overlay || !container) return;

        // Find the Rive WebGL canvas (first canvas inside container)
        const sourceCanvas = container.querySelector("canvas") as HTMLCanvasElement | null;
        if (!sourceCanvas) return;

        const W = sourceCanvas.clientWidth || sourceCanvas.width;
        const H = sourceCanvas.clientHeight || sourceCanvas.height;
        if (W === 0 || H === 0) return;

        if (overlay.width !== W || overlay.height !== H) {
            overlay.width = W;
            overlay.height = H;
            rainRef.current = [];
            pixelSupportedRef.current = null; // re-test on resize
        }

        const ctx = overlay.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, W, H);

        // ── Build offscreen sampler ──────────────────────────────────────────────
        if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas");
        const offscreen = offscreenRef.current;
        const cols = Math.floor(W / charSize);
        const rows = Math.floor(H / charSize);
        if (offscreen.width !== cols) offscreen.width = cols;
        if (offscreen.height !== rows) offscreen.height = rows;

        const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
        if (!offCtx) return;

        // ── Try pixel-accurate render ────────────────────────────────────────────
        if (pixelSupportedRef.current !== false) {
            let pixels: ImageData | null = null;
            try {
                offCtx.clearRect(0, 0, cols, rows);
                offCtx.drawImage(sourceCanvas, 0, 0, cols, rows);
                pixels = offCtx.getImageData(0, 0, cols, rows);
            } catch {
                pixelSupportedRef.current = false;
            }

            if (pixels) {
                // Check if buffer has real content (not all zeros = WebGL cleared)
                let hasContent = false;
                const step = Math.max(1, Math.floor(pixels.data.length / 800));
                for (let i = 3; i < pixels.data.length; i += step * 4) {
                    if (pixels.data[i] > 8) { hasContent = true; break; }
                }

                if (hasContent) {
                    pixelSupportedRef.current = true;
                    renderAsciiFromPixels(ctx, pixels, cols, rows, W, H);
                    return;
                } else if (pixelSupportedRef.current === null) {
                    // First frame might be blank while Rive loads — keep trying
                    // but don't permanently mark as unsupported yet
                }
            }
        }

        // ── Fallback: Matrix rain ────────────────────────────────────────────────
        renderMatrixRain(ctx, W, H, cols, rows);

        function renderAsciiFromPixels(
            ctx: CanvasRenderingContext2D,
            pixels: ImageData,
            cols: number,
            rows: number,
            _W: number,
            _H: number,
        ) {
            const [cr, cg, cb] = parseColor(color);
            ctx.font = `bold ${charSize}px "Courier New", Courier, monospace`;
            ctx.textBaseline = "top";

            const blend = colorBlendRef.current;
            const srcW = 1 - blend;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const idx = (row * cols + col) * 4;
                    const pr = pixels.data[idx];
                    const pg = pixels.data[idx + 1];
                    const pb = pixels.data[idx + 2];
                    const pa = pixels.data[idx + 3];

                    if (pa < 12) continue; // fully transparent → skip

                    // Perceived luminance (0..1)
                    const lum = (0.299 * pr + 0.587 * pg + 0.114 * pb) / 255;
                    const charIdx = Math.min(
                        chars.length - 1,
                        Math.floor(lum * chars.length),
                    );
                    const ch = chars[charIdx];
                    if (ch === " ") continue;

                    // Tint: blend source pixel color with user color
                    const blendR = Math.round(pr * srcW + cr * blend);
                    const blendG = Math.round(pg * srcW + cg * blend);
                    const blendB = Math.round(pb * srcW + cb * blend);
                    const alpha = (pa / 255) * opacity;

                    ctx.fillStyle = `rgba(${blendR},${blendG},${blendB},${alpha.toFixed(3)})`;
                    ctx.fillText(ch, col * charSize, row * charSize);
                }
            }
        }

        function renderMatrixRain(
            ctx: CanvasRenderingContext2D,
            W: number,
            H: number,
            cols: number,
            rows: number,
        ) {
            if (rainRef.current.length !== cols) {
                rainRef.current = Array.from({ length: cols }, () =>
                    Math.floor(Math.random() * rows),
                );
            }
            const [cr, cg, cb] = parseColor(color);
            ctx.font = `${charSize}px "Courier New", Courier, monospace`;
            ctx.textBaseline = "top";
            void W; void H;

            rainRef.current.forEach((y, col) => {
                const trailLen = 8;
                for (let t = 0; t < trailLen; t++) {
                    const row = y - t;
                    if (row < 0 || row >= rows) continue;
                    const fade = 1 - t / trailLen;
                    const charIdx = Math.floor(Math.random() * chars.length);
                    const ch = chars[charIdx] || chars[1];
                    ctx.fillStyle =
                        t === 0
                            ? `rgba(255,255,255,${(fade * opacity).toFixed(3)})`
                            : `rgba(${cr},${cg},${cb},${(fade * opacity * 0.8).toFixed(3)})`;
                    ctx.fillText(ch, col * charSize, row * charSize);
                }
                if (Math.random() > 0.6) {
                    rainRef.current[col] = (y + 1) % (rows + trailLen);
                }
            });
        }
    }, [chars, charSize, color, opacity, parseColor]);

    useEffect(() => {
        if (!enabled) {
            const overlay = overlayRef.current;
            if (overlay) {
                overlay.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        const loop = () => {
            renderFrame();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [enabled, renderFrame]);

    return { overlayRef, containerRef };
}
