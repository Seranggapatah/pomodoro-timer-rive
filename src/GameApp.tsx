import { useEffect } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-webgl2";
import flappyDroidRiv from "./assets/rive/flappy_droid.riv";
import { useGameStore } from "./stores/gameStore";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameAppProps {
    onClose: () => void;
}

export default function GameApp({ onClose }: GameAppProps) {
    const updateFlappyScore = useGameStore(s => s.updateFlappyScore);
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RiveComponent, rive } = useRive({
        src: flappyDroidRiv,
        autoplay: true,
        autoBind: true,
        artboard: "artboard",
        stateMachines: "main",
        layout: new Layout({
            fit: Fit.Cover,
            alignment: Alignment.Center,
        }),
    });

    useEffect(() => {
        if (rive && rive.viewModelInstance) {
            const interval = setInterval(() => {
                const scoreProp = rive.viewModelInstance?.number("property of Vmodel/Score");
                if (scoreProp) {
                    const scoreVal = scoreProp.value;
                    updateFlappyScore(scoreVal);
                }
            }, 500);

            return () => clearInterval(interval);
        }
    }, [rive, updateFlappyScore]);

    return (
        <div className="absolute inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden w-[350px] max-w-full aspect-[9/16] relative">
                
                {/* Modern Window TitleBar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30 backdrop-blur-xl relative z-10 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                        Flappy Droid
                    </span>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full ">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[9px] uppercase font-bold tracking-widest">Running</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose}
                            className="h-6 w-6 rounded-[6px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            title="Close Game"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </div>

                {/* Game Canvas */}
                <div className="flex-1 w-full bg-background relative overflow-hidden">
                    <RiveComponent className="absolute inset-0 w-full h-full object-cover" />
                </div>
            </div>
        </div>
    );
}
