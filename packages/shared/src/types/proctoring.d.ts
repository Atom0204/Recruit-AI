export interface ProctoringConfig {
    enableGazeTracking: boolean;
    enableTabSwitchDetection: boolean;
    enableMultipleScreenDetection: boolean;
    enableAudioAnomalyDetection: boolean;
    enableClipboardMonitoring: boolean;
    alertThreshold: number;
}
export type ProctoringEventType = "TAB_SWITCH" | "GAZE_AWAY" | "FACE_NOT_DETECTED" | "AUDIO_ANOMALY" | "CLIPBOARD_PASTE";
export interface ProctoringEvent {
    timestamp: string;
    type: ProctoringEventType;
    severity: "low" | "medium" | "high";
    details: string;
}
