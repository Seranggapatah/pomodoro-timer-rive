import { useEffect, useRef, useState } from "react";
import { Star, Zap } from "lucide-react";

interface XPDisplayProps {
    level: number;
    xp: number;
    xpToNextLevel: number;
    xpPercent: number;
    totalXp: number;
    className?: string; // allow overrides
}

export function XPDisplay({ level, xp, xpToNextLevel, xpPercent, totalXp, className }: XPDisplayProps) {
    const [animatedPercent, setAnimatedPercent] = useState(xpPercent);
    const [showGain, setShowGain] = useState(false);
    const [gainAmount, setGainAmount] = useState(0);
    const prevXpRef = useRef(xp);
    const gainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animasikan XP bar ketika XP bertambah
    useEffect(() => {
        const diff = xp - prevXpRef.current;
        if (diff !== 0) {
            const gained = diff > 0 ? diff : xpToNextLevel + diff;
            setGainAmount(gained > 0 ? gained : 0);
            setShowGain(true);

            if (gainTimeoutRef.current) clearTimeout(gainTimeoutRef.current);
            gainTimeoutRef.current = setTimeout(() => setShowGain(false), 2000);
        }
        prevXpRef.current = xp;

        const timer = setTimeout(() => setAnimatedPercent(xpPercent), 50);
        return () => clearTimeout(timer);
    }, [xp, xpPercent, xpToNextLevel]);

    return (
        <div className={className || "flex flex-col gap-4 p-4 w-full relative"}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500/10 text-orange-500 p-2 rounded-xl flex items-center justify-center">
                        <Star size={16} className="fill-orange-500 text-orange-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight text-stone-800">Level {level}</span>
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium mt-0.5">{totalXp.toLocaleString()} Total XP</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center font-bold text-lg leading-tight text-stone-800 font-mono">
                        {xp} <span className="text-stone-400 font-normal text-sm ml-1">/ {xpToNextLevel}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-orange-500 font-bold flex items-center gap-1 mt-0.5">
                        <Zap size={10} className="fill-orange-500" /> {xpPercent.toFixed(0)}% TO NEXT
                    </span>
                </div>
            </div>
            
            <div className="relative mt-2">
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${animatedPercent}%` }}
                    />
                </div>
                {showGain && gainAmount > 0 && (
                    <div className="absolute -top-7 right-0 text-xs font-bold text-orange-500 animate-in slide-in-from-bottom-2 fade-in">
                        +{gainAmount} XP
                    </div>
                )}
            </div>
        </div>
    );
}
