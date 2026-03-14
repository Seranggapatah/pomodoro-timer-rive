import { useEffect, useRef, useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AmbientSound } from "../types";

// ---------------------------------------------------------------------------
function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

// ---------------------------------------------------------------------------
interface AmbientState {
    ambientType: AmbientSound;
    setAmbientType: (v: AmbientSound) => void;
    cycleAmbient: () => void;
}

export const useAmbientStore = create<AmbientState>()(
    persist(
        (set, get) => ({
            ambientType: readLS<AmbientSound>("pomodoro-ambient", "off"),

            setAmbientType: (v) => set({ ambientType: v }),

            cycleAmbient: () => {
                const order: AmbientSound[] = ["off", "rain", "white-noise", "lofi"];
                const idx = order.indexOf(get().ambientType);
                set({ ambientType: order[(idx + 1) % order.length] });
            },
        }),
        { name: "pomodoro-ambient-store" }
    )
);

// ---------------------------------------------------------------------------
// Audio helpers (migrated from useAmbientSound.ts)
// ---------------------------------------------------------------------------
function createNoiseNode(ctx: AudioContext): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
}

function setupSound(
    ctx: AudioContext,
    type: AmbientSound
): AudioBufferSourceNode | null {
    if (type === "off") return null;
    const noise = createNoiseNode(ctx);
    const gain = ctx.createGain();

    if (type === "rain") {
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 0.5;
        gain.gain.value = 0.08;
        noise.connect(bandpass).connect(gain).connect(ctx.destination);
    } else if (type === "white-noise") {
        gain.gain.value = 0.04;
        noise.connect(gain).connect(ctx.destination);
    } else if (type === "lofi") {
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 400;
        gain.gain.value = 0.12;
        noise.connect(lowpass).connect(gain).connect(ctx.destination);
    }
    noise.start();
    return noise;
}

// ---------------------------------------------------------------------------
// Thin effect hook — manages AudioContext lifecycle (call once in App)
// ---------------------------------------------------------------------------
export function useAmbientEffect() {
    const ambientType = useAmbientStore((s) => s.ambientType);
    const ctxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stopSound = useCallback(() => {
        try { sourceRef.current?.stop(); } catch { /* ignore */ }
        sourceRef.current = null;
        try { ctxRef.current?.close(); } catch { /* ignore */ }
        ctxRef.current = null;
    }, []);

    useEffect(() => {
        stopSound();
        if (ambientType !== "off") {
            try {
                const ctx = new AudioContext();
                ctxRef.current = ctx;
                sourceRef.current = setupSound(ctx, ambientType);
            } catch { /* ignore */ }
        }
        return () => stopSound();
    }, [ambientType, stopSound]);
}
