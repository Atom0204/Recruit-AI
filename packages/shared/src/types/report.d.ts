import type { ProctoringEvent } from "./proctoring";
import type { TranscriptEntry } from "./interview";
export interface CandidateFitReport {
    candidateName: string;
    role: string;
    date: string;
    overallScore: number;
    verdict: "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire";
    categoryScores: Array<{
        category: string;
        score: number;
        weight: number;
        feedback: string;
    }>;
    sentimentAnalysis: {
        overallConfidence: number;
        emotionalArc: Array<{
            question: number;
            sentiment: "positive" | "neutral" | "anxious" | "confused";
            confidence: number;
        }>;
        flags: string[];
    };
    areasOfStrength: string[];
    areasForImprovement: string[];
    recommendedResources: Array<{
        topic: string;
        resource: string;
        url: string;
    }>;
    transcript: TranscriptEntry[];
    proctoringLog: ProctoringEvent[];
    generatedAt: string;
}
