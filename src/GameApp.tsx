import { useEffect } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-webgl2";
import flappyDroidRiv from "./assets/rive/flappy_droid.riv";
import { useGameStore } from "./stores/gameStore";
import "./App.css";

interface GameAppProps {
    onClose: () => void;
}

export default function GameApp({ onClose }: GameAppProps) {
    const updateFlappyScore = useGameStore(s => s.updateFlappyScore);
    
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
            console.log("Rive ViewModel Loaded!");

            // Print all available view model properties to console to debug the correct name for "Score"
            try {
                // @ts-ignore
                const props = rive.viewModelInstance.properties;
                console.log("Available ViewModel Properties:", props.map((p: any) => p.name));
            } catch (e) {
                console.log("Could not list ViewModel properties natively.");
            }

            // Polling nilai Score dari ViewModel 
            const interval = setInterval(() => {
                // The Score property is nested inside the "property of Vmodel" ViewModel group
                const scoreProp = rive.viewModelInstance?.number("property of Vmodel/Score");
                
                if (scoreProp) {
                    const scoreVal = scoreProp.value;
                    // Hanya print dan save jika ada value yang valid
                    // updateFlappyScore sendiri (di gameStore) sudah diproteksi 
                    // agar hanya save jika `scoreVal > prevScore`
                    updateFlappyScore(scoreVal);
                }
            }, 500); // interval diturunkan rate pollnya agar tidak terlalu berat membebani zustand tiap milidetik

            return () => clearInterval(interval);
        }
    }, [rive, updateFlappyScore]);

    return (
        <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <div
                className="app-container"
                style={{
                    position: "relative",
                    width: "250px",   /* Ukuran tertentu frame game */
                    height: "600px",
                    maxWidth: "90%",
                    maxHeight: "90%",
                    backgroundColor: "var(--bg-primary)",
                    boxShadow: "0 0 40px rgba(0, 255, 65, 0.15)",
                }}
            >
                {/* Title Bar for Game */}
                <div className="titlebar">
                    <div className="titlebar-left" style={{ pointerEvents: 'none' }}>
                        <span className="titlebar-label">
                            flappy_droid
                        </span>
                    </div>

                    <div className="titlebar-status">
                        <span className="status-indicator running">●</span>
                        <span className="status-text running" style={{ color: "var(--accent-break)" }}>game_active</span>
                    </div>

                    <div className="titlebar-controls" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            className="titlebar-btn"
                            onClick={onClose}
                            style={{ color: 'var(--accent-danger)' }}
                            title="Close Game"
                        >
                            [x]
                        </button>
                    </div>
                </div>
                <div style={{ flex: 1, width: "100%", position: "relative" }}>
                    <RiveComponent style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />
                </div>
            </div>
        </div>
    );
}
