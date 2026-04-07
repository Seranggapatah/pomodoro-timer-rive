import { Minus, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SettingsPanelProps {
    focusDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    autoStart: boolean;
    isAutoStartOnLogin?: boolean;
    onFocusDurationChange: (minutes: number) => void;
    onBreakDurationChange: (minutes: number) => void;
    onLongBreakDurationChange: (minutes: number) => void;
    onAutoStartChange: (autoStart: boolean) => void;
    onToggleAutoStartOnLogin?: () => void;
}

interface DurationRowProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
}

function DurationRow({ label, value, min, max, step = 1, onChange }: DurationRowProps) {
    return (
        <div className="flex items-center justify-between w-full">
            <Label className="text-muted-foreground uppercase text-[10px] tracking-widest font-medium cursor-help" title={`Range: ${min}-${max}`}>
                {label}
            </Label>
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-md text-muted-foreground"
                    onClick={() => onChange(Math.max(min, value - step))}
                    disabled={value <= min}
                >
                    <Minus size={12} />
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{value}</span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-md text-muted-foreground"
                    onClick={() => onChange(Math.min(max, value + step))}
                    disabled={value >= max}
                >
                    <Plus size={12} />
                </Button>
            </div>
        </div>
    );
}

export function SettingsPanel({
    focusDuration,
    breakDuration,
    longBreakDuration,
    autoStart,
    isAutoStartOnLogin = false,
    onFocusDurationChange,
    onBreakDurationChange,
    onLongBreakDurationChange,
    onAutoStartChange,
    onToggleAutoStartOnLogin,
}: SettingsPanelProps) {
    return (
        <div className="flex flex-col p-4 gap-0 border border-stone-200 rounded-xl bg-white overflow-hidden w-full">
            <div className="select-none flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Settings2 size={14} className="text-orange-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">CONFIGURATION</span>
                </div>
            </div>
            
            <Separator className="my-0 block" />
            
            <div className="flex-col gap-4 mt-3 flex">
                <DurationRow label="Focus (min)" value={focusDuration} min={1} max={120} step={5} onChange={onFocusDurationChange} />
                <DurationRow label="Break (min)" value={breakDuration} min={1} max={60} step={1} onChange={onBreakDurationChange} />
                <DurationRow label="Long Break" value={longBreakDuration} min={1} max={60} step={5} onChange={onLongBreakDurationChange} />

                <Separator className="my-0" />
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-stone-500 uppercase text-[10px] tracking-widest font-medium cursor-pointer" onClick={() => onAutoStartChange(!autoStart)}>
                            Auto Start Timer
                        </Label>
                        <Switch checked={autoStart} onCheckedChange={onAutoStartChange} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label className="text-stone-500 uppercase text-[10px] tracking-widest font-medium cursor-pointer" onClick={() => onToggleAutoStartOnLogin?.()}>
                            Run on Startup
                        </Label>
                        <Switch checked={isAutoStartOnLogin} onCheckedChange={() => onToggleAutoStartOnLogin?.()} />
                    </div>
                </div>
            </div>

        </div>
    );
}
