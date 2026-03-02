import type { ProctoringEvent } from "@recruitai/shared";

interface LatencyInput {
  responseLatencyMs: number;
  tokenLikeDensity: number;
  fillerRatio: number;
}

export const detectShadowAssistance = (input: LatencyInput): ProctoringEvent | null => {
  const suspiciousLatency = input.responseLatencyMs > 14000;
  const overlyPolished = input.tokenLikeDensity > 0.78 && input.fillerRatio < 0.02;

  if (suspiciousLatency && overlyPolished) {
    return {
      timestamp: new Date().toISOString(),
      type: "AUDIO_ANOMALY",
      severity: "high",
      details: "Latency and language pattern suggest possible external assistance."
    };
  }

  return null;
};
