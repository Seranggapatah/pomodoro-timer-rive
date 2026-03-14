import { useEffect, useRef } from "react";

interface TimerMillisProps {
    msLeftRef: React.MutableRefObject<number>;
    isActive: boolean;
    className?: string;
}

export function TimerMillis({ msLeftRef, isActive, className }: TimerMillisProps) {
    const spanRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let rafId: number;

        const update = () => {
            if (spanRef.current && msLeftRef.current !== undefined) {
                const totalMs = Math.max(0, msLeftRef.current);
                const centis = Math.floor((totalMs % 1000) / 10);
                spanRef.current.textContent = `.${centis.toString().padStart(2, "0")}`;
            }
            if (isActive) {
                rafId = requestAnimationFrame(update);
            }
        };

        if (isActive) {
            rafId = requestAnimationFrame(update);
        } else {
            update();
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isActive, msLeftRef]);

    const totalMs = msLeftRef?.current ? Math.max(0, msLeftRef.current) : 0;
    const centis = Math.floor((totalMs % 1000) / 10);

    return (
        <span ref={spanRef} className={className}>
            .{centis.toString().padStart(2, "0")}
        </span>
    );
}
