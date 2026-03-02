import { useEffect, useRef } from "react";
import type { PlayBurstState } from "../hooks/usePlayFeedback";

interface PlayBurstProps {
    state: PlayBurstState;
}

/**
 * Full-screen fixed overlay: renders particles + ripple rings.
 * Pointer-events: none so it never blocks interactions.
 */
export function PlayBurst({ state }: PlayBurstProps) {
    const { particles, ripples, screenPulse } = state;

    return (
        <>
            {/* ── Screen-wide radial pulse ── */}
            {screenPulse && <div className="play-screen-pulse" key={Date.now()} />}

            {/* ── Fixed overlay for particles + ripples ── */}
            <div className="play-burst-layer" aria-hidden="true">
                {/* Ripple rings */}
                {ripples.map(r => (
                    <RippleRing key={r.id} x={r.x} y={r.y} delay={r.delay} />
                ))}

                {/* ASCII particles */}
                {particles.map(p => (
                    <span
                        key={p.id}
                        className="play-particle"
                        style={{
                            left: p.x,
                            top: p.y,
                            fontSize: p.size,
                            color: p.color,
                            opacity: Math.max(0, p.life),
                            textShadow: `0 0 ${Math.round(p.size * 1.5)}px ${p.color}`,
                            transform: `translate(-50%, -50%) rotate(${(1 - p.life) * 360}deg)`,
                        }}
                    >
                        {p.char}
                    </span>
                ))}
            </div>
        </>
    );
}

/** Single expanding + fading ring */
function RippleRing({ x, y, delay }: { x: number; y: number; delay: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.animationDelay = `${delay}ms`;
        el.classList.add("play-ripple-animate");
    }, [delay]);

    return (
        <div
            ref={ref}
            className="play-ripple"
            style={{ left: x, top: y }}
        />
    );
}
