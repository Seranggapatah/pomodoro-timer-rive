

interface HourlyChartProps {
    hourlyData: Record<number, number>;
}

function formatHour(h: number): string {
    if (h === 0) return "12a";
    if (h === 12) return "12p";
    return h < 12 ? `${h}a` : `${h - 12}p`;
}

export function HourlyChart({ hourlyData }: HourlyChartProps) {
    const hours = Array.from({ length: 24 }, (_, h) => h);
    const values = hours.map(h => hourlyData[h] ?? 0);
    const maxVal = Math.max(...values, 1);
    const totalSessions = values.reduce((a, b) => a + b, 0);

    const peakHour = values.indexOf(Math.max(...values));


    const SHOW_LABELS = new Set([0, 3, 6, 9, 12, 15, 18, 21, 23]);

    return (
        <div className="flex flex-col gap-0 w-full h-full">

            <div className="flex items-end justify-between h-32 mt-1 gap-1.5 pb-2 border-b border-stone-200/50">
                {hours.map(h => {
                    const val = values[h];
                    const heightPct = (val / maxVal) * 100;
                    const isPeak = h === peakHour && maxVal > 0;
                    return (
                        <div key={h} className="relative flex flex-col items-center justify-end h-full w-full group cursor-pointer">
                            <div 
                                className={`w-full rounded-t-sm transition-all duration-500 ease-out group-hover:opacity-80 group-hover:scale-y-105 origin-bottom ${isPeak ? "bg-orange-500" : "bg-orange-500/30"}`}
                                style={{ height: `${Math.max(heightPct, val > 0 ? 10 : 0)}%`, minHeight: val > 0 ? "4px" : "0px" }}
                                title={`${formatHour(h)}: ${val} session${val !== 1 ? "s" : ""}`}
                            />
                            {SHOW_LABELS.has(h) && (
                                <span className="absolute -bottom-6 text-[9px] text-stone-400 font-medium uppercase tracking-widest opacity-80">{formatHour(h)}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="text-[10px] font-medium text-stone-500 text-center mt-5 uppercase tracking-widest bg-stone-50 py-1.5 rounded-lg border border-stone-200/50">
                Based on 7-Day Data • {totalSessions} Sessions
            </div>
        </div>
    );
}
