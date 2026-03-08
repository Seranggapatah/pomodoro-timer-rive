import { X, Bug, Database, Bell, Trash2, Zap } from "lucide-react";
import "./DebugPanel.css"; // We will create this

interface DebugPanelProps {
    onClose: () => void;
    triggerWelcomeNotification: () => void;
    triggerMorningNotification: () => void;
    notifyTimerComplete: (mode: "focus" | "break") => void;
    testAlarm: () => void;
    game: any;
    tasks: any;
}

export function DebugPanel({
    onClose,
    triggerWelcomeNotification,
    triggerMorningNotification,
    notifyTimerComplete,
    testAlarm,
    game,
    tasks,
}: DebugPanelProps) {
    const handleAddRandomTasks = () => {
        for (let i = 1; i <= 5; i++) {
            tasks.addDashboardTask(`Dummy Task ${Math.floor(Math.random() * 1000)}`);
        }
    };

    const handleAddXP = () => {
        // useGameData has recordGameSession(minutes). Let's simulate 120 minutes (which is 120 XP usually)
        game.recordGameSession(120);
    };

    const handleResetAll = () => {
        if (window.confirm("ARE YOU SURE? This will clear ALL local storage and reload!")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="debug-overlay" data-tauri-drag-region>
            <div className="debug-panel">
                <div className="debug-header">
                    <h3><Bug size={16} /> Super Admin / Debug</h3>
                    <button className="close-btn" onClick={onClose} title="Close Debug">
                        <X size={16} />
                    </button>
                </div>

                <div className="debug-content">
                    <div className="debug-section">
                        <h4><Bell size={14} /> Notifications & Sound</h4>
                        <div className="debug-btn-group">
                            <button onClick={triggerWelcomeNotification}>Show "Welcome Back"</button>
                            <button onClick={triggerMorningNotification}>Show "Morning Reminder" (10 AM)</button>
                            <button onClick={testAlarm}>Test Alarm Sound</button>
                            <button onClick={() => notifyTimerComplete("focus")}>Simulate Focus End</button>
                            <button onClick={() => notifyTimerComplete("break")}>Simulate Break End</button>
                        </div>
                    </div>

                    <div className="debug-section">
                        <h4><Database size={14} /> Data Population</h4>
                        <div className="debug-btn-group">
                            <button onClick={handleAddRandomTasks}>Add 5 Random Tasks</button>
                            <button onClick={handleAddXP}><Zap size={14} style={{ marginRight: 4 }} />Add 120 XP (Simulate 2hrs)</button>
                            <button onClick={() => game.recordTaskComplete()}>Trigger Task Complete (Game logic)</button>
                        </div>
                    </div>

                    <div className="debug-section danger-zone">
                        <h4><Trash2 size={14} /> Danger Zone</h4>
                        <p className="debug-desc">Be careful, this wipes out all data in your browser storage.</p>
                        <button className="danger-btn" onClick={handleResetAll}>
                            Nuke All Data (Clear LocalStorage)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
