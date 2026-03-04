import { useEffect, useRef } from "react";

const ASCII_CHARS = " .:-=+*#%@";

export function AsciiOverlay({ sourceSelector }: { sourceSelector: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        let animationId: number;
        let lastRenderTime = 0;
        const fps = 15; // Limit FPS for ASCII effect to make it look "retro"
        const interval = 1000 / fps;

        const renderAscii = (time: number) => {
            animationId = requestAnimationFrame(renderAscii);

            if (time - lastRenderTime < interval) return;
            lastRenderTime = time;

            // Wait until the 3D WebGL context from Rive is ready
            const sourceCanvas = document.querySelector(sourceSelector) as HTMLCanvasElement;
            if (!sourceCanvas) return;

            const w = sourceCanvas.clientWidth || 300;
            const h = sourceCanvas.clientHeight || 300;

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            const charSize = 8;
            const cols = Math.floor(w / charSize);
            const rows = Math.floor(h / charSize);

            // Scaled canvas
            const offscreen = document.createElement("canvas");
            offscreen.width = cols;
            offscreen.height = rows;
            const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
            if (!offCtx) return;

            try {
                // Read from WebGL canvas might fail if preserveDrawingBuffer is false,
                // but Tauri Webview Webkit might allow it since we capture right after render
                offCtx.drawImage(sourceCanvas, 0, 0, cols, rows);
                const imageData = offCtx.getImageData(0, 0, cols, rows);
                const pixels = imageData.data;

                ctx.clearRect(0, 0, w, h);
                ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary').trim() || "#00ff41";
                ctx.font = `bold ${charSize + 1}px monospace`;
                ctx.textBaseline = "top";

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const idx = (y * cols + x) * 4;
                        const r = pixels[idx];
                        const g = pixels[idx + 1];
                        const b = pixels[idx + 2];
                        const a = pixels[idx + 3];

                        if (a < 50) continue;

                        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                        const charIdx = Math.floor(luma * (ASCII_CHARS.length - 1));
                        const char = ASCII_CHARS[charIdx];

                        if (char !== ' ') {
                            ctx.fillText(char, x * charSize, y * charSize);
                        }
                    }
                }
            } catch (err) {
                // Silently ignore cross-origin or buffer errors
            }
        };

        animationId = requestAnimationFrame(renderAscii);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [sourceSelector]);

    return (
        <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
        </div>
    );
}
