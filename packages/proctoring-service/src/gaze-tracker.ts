import type { ProctoringEvent } from "@recruitai/shared";

interface GazeInput {
  faceDetected: boolean;
  lookingAtScreen: boolean;
}

export const evaluateGaze = (input: GazeInput): ProctoringEvent | null => {
  if (!input.faceDetected) {
    return {
      timestamp: new Date().toISOString(),
      type: "FACE_NOT_DETECTED",
      severity: "high",
      details: "No face detected by camera feed."
    };
  }

  if (!input.lookingAtScreen) {
    return {
      timestamp: new Date().toISOString(),
      type: "GAZE_AWAY",
      severity: "low",
      details: "Candidate gaze moved away from screen."
    };
  }

  return null;
};
