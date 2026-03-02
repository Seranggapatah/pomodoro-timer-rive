import { useCallback, useRef } from "react";

export interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    char: string;
    color: string;
    size: number;
    life: number; // 1 = just born, 0 = dead
}

export interface Ripple {
    id: number;
    x: number;
    y: number;
    delay: number;
}

export interface PlayBurstState {
    particles: Particle[];
    ripples: Ripple[];
    screenPulse: boolean;
    buttonBurst: boolean;
}

const CHARS_START = ">*#@+▶!^~=>".split("");
const CHARS_PAUSE = "■□●○◆◇×+!".split("");
const COLORS_START = ["#00ff41", "#00ff88", "#ffffff", "#c8ff80", "#00cfff"];
const COLORS_PAUSE = ["#ff3333", "#ff6600", "#ff88aa", "#ffffff", "#ffaa00"];

let _uid = 0;
const uid = () => ++_uid;

export const INITIAL_BURST_STATE: PlayBurstState = {
    particles: [],
    ripples: [],
    screenPulse: false,
    buttonBurst: false,
};

/**
 * Hook that drives the play-button burst animation.
 * Pass the same stable `setState` from TimerControls.
 */
export function usePlayFeedback(
    setState: React.Dispatch<React.SetStateAction<PlayBurstState>>,
    btnRef: React.RefObject<HTMLButtonElement | null>,
) {
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    const trigger = useCallback(
        (isCurrentlyActive: boolean) => {
            // Cancel any running animation
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            const isPause = isCurrentlyActive; // clicking pause = was active
            const chars = isPause ? CHARS_PAUSE : CHARS_START;
            const colors = isPause ? COLORS_PAUSE : COLORS_START;

            // Get button center in viewport coords
            const rect = btnRef.current?.getBoundingClientRect();
            const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
            const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

            // Spawn particles
            const count = 30;
            const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
                const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const speed = 100 + Math.random() * 220;
                return {
                    id: uid(),
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    char: chars[Math.floor(Math.random() * chars.length)],
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: 10 + Math.random() * 10,
                    life: 1,
                };
            });
            particlesRef.current = newParticles;

            // Ripples & pulse
            const ripples: Ripple[] = [
                { id: uid(), x: cx, y: cy, delay: 0 },
                { id: uid(), x: cx, y: cy, delay: 90 },
                { id: uid(), x: cx, y: cy, delay: 180 },
            ];

            setState({
                particles: newParticles,
                ripples,
                screenPulse: true,
                buttonBurst: true,
            });

            // Animate particles frame-by-frame
            let last = performance.now();
            const loop = (now: number) => {
                const dt = Math.min((now - last) / 1000, 0.05);
                last = now;

                particlesRef.current = particlesRef.current
                    .map(p => ({
                        ...p,
                        x: p.x + p.vx * dt,
                        y: p.y + p.vy * dt,
                        vx: p.vx * (1 - 4 * dt),
                        vy: p.vy * (1 - 4 * dt) + 80 * dt, // gentle gravity
                        life: p.life - dt * 1.6,
                    }))
                    .filter(p => p.life > 0);

                // Push snapshot to React state
                const snapshot = [...particlesRef.current];
                setState(prev => ({ ...prev, particles: snapshot }));

                if (particlesRef.current.length > 0) {
                    rafRef.current = requestAnimationFrame(loop);
                } else {
                    rafRef.current = null;
                }
            };
            rafRef.current = requestAnimationFrame(loop);

            // Timed cleanup
            setTimeout(() => setState(prev => ({ ...prev, screenPulse: false })), 420);
            setTimeout(() => setState(prev => ({ ...prev, buttonBurst: false })), 580);
            setTimeout(() => setState(prev => ({ ...prev, ripples: [] })), 820);
        },
        [setState, btnRef],
    );

    return { trigger };
}
