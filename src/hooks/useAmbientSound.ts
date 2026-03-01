import { useEffect, useRef, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { AmbientSound } from "../types";

/**
 * Buat noise node menggunakan AudioBufferSourceNode.
 */
function createNoiseNode(ctx: AudioContext): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 2; // 2 detik buffer, loop
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

/**
 * Setup audio graph untuk jenis suara tertentu.
 */
function setupSound(ctx: AudioContext, type: AmbientSound): AudioBufferSourceNode | null {
    if (type === "off") return null;

    const noise = createNoiseNode(ctx);
    const gain = ctx.createGain();

    if (type === "rain") {
        // Filtered noise → efek hujan
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 0.5;
        gain.gain.value = 0.08;
        noise.connect(bandpass).connect(gain).connect(ctx.destination);
    } else if (type === "white-noise") {
        // Raw white noise, volume rendah
        gain.gain.value = 0.04;
        noise.connect(gain).connect(ctx.destination);
    } else if (type === "lofi") {
        // Low-pass filtered → hum lembut
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 400;
        gain.gain.value = 0.12;
        noise.connect(lowpass).connect(gain).connect(ctx.destination);
    }

    noise.start();
    return noise;
}

/**
 * Hook untuk ambient sound (hujan, white noise, lofi).
 * Suara di-generate via Web Audio API tanpa file eksternal.
 */
export function useAmbientSound() {
    const [ambientType, setAmbientType] = useLocalStorage<AmbientSound>("pomodoro-ambient", "off");
    const ctxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Stop & cleanup current sound
    const stopSound = useCallback(() => {
        try {
            sourceRef.current?.stop();
        } catch { /* ignore */ }
        sourceRef.current = null;
        try {
            ctxRef.current?.close();
        } catch { /* ignore */ }
        ctxRef.current = null;
    }, []);

    // Start new sound whenever type changes
    useEffect(() => {
        stopSound();

        if (ambientType !== "off") {
            try {
                const ctx = new AudioContext();
                ctxRef.current = ctx;
                sourceRef.current = setupSound(ctx, ambientType);
            } catch { /* ignore if unavailable */ }
        }

        return () => stopSound();
    }, [ambientType, stopSound]);

    const cycleAmbient = useCallback(() => {
        const order: AmbientSound[] = ["off", "rain", "white-noise", "lofi"];
        const idx = order.indexOf(ambientType);
        setAmbientType(order[(idx + 1) % order.length]);
    }, [ambientType, setAmbientType]);

    return {
        ambientType,
        setAmbientType,
        cycleAmbient,
    };
}
