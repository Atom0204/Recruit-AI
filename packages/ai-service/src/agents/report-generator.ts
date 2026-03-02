import type { CandidateFitReport, ProctoringEvent, TranscriptEntry } from "@recruitai/shared";
import { clampScore } from "../utils/scoring";

interface ReportInput {
  candidateName: string;
  role: string;
  categoryScores: Array<{ category: string; score: number; weight: number; feedback: string }>;
  transcript: TranscriptEntry[];
  proctoringLog: ProctoringEvent[];
}

const severityPenalty: Record<ProctoringEvent["severity"], number> = {
  low: 1,
  medium: 3,
  high: 6
};

const deriveVerdict = (score: number): CandidateFitReport["verdict"] => {
  if (score >= 90) return "Strong Hire";
  if (score >= 78) return "Hire";
  if (score >= 65) return "Lean Hire";
  if (score >= 50) return "Lean No Hire";
  return "No Hire";
};

export const generateCandidateReport = async (input: ReportInput): Promise<CandidateFitReport> => {
  const weighted = input.categoryScores.reduce((sum, item) => sum + item.score * item.weight, 0);
  const proctoringPenalty = input.proctoringLog.reduce((sum, event) => sum + severityPenalty[event.severity], 0);
  const transcriptDensity = input.transcript
    .filter((entry) => entry.speaker === "Candidate")
    .reduce((sum, entry) => sum + entry.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const communicationBoost = transcriptDensity > 420 ? 3 : transcriptDensity > 250 ? 1 : 0;
  const overallScore = clampScore(Math.round(weighted + communicationBoost - proctoringPenalty * 0.6));
  const confidencePenalty = Math.min(16, proctoringPenalty * 1.2);
  const confidenceBonus = transcriptDensity > 300 ? 3 : 0;
  const confidenceScore = clampScore(overallScore - confidencePenalty + confidenceBonus);
  const hasSeriousFlag = input.proctoringLog.some((event) => event.severity === "high");
  const proctoringFlags = [
    ...(input.proctoringLog.length > 0 ? ["Proctoring review recommended"] : []),
    ...(hasSeriousFlag ? ["High-severity integrity events detected"] : [])
  ];
  const emotionalArc = input.categoryScores.map((_, idx) => {
    const confidence = clampScore(Math.round(confidenceScore - Math.max(0, idx - 1) * 2 + idx));
    const sentiment: CandidateFitReport["sentimentAnalysis"]["emotionalArc"][number]["sentiment"] =
      confidence >= 82 ? "positive" : confidence >= 70 ? "neutral" : confidence >= 58 ? "anxious" : "confused";
    return {
      question: idx + 1,
      sentiment,
      confidence
    };
  });

  return {
    candidateName: input.candidateName,
    role: input.role,
    date: new Date().toISOString(),
    overallScore,
    verdict: deriveVerdict(overallScore),
    categoryScores: input.categoryScores,
    sentimentAnalysis: {
      overallConfidence: confidenceScore,
      emotionalArc,
      flags: proctoringFlags
    },
    areasOfStrength: input.categoryScores.filter((x) => x.score >= 75).map((x) => x.category),
    areasForImprovement: input.categoryScores.filter((x) => x.score < 70).map((x) => x.category),
    recommendedResources: [
      {
        topic: "System Design",
        resource: "Designing Data-Intensive Applications",
        url: "https://dataintensive.net/"
      },
      {
        topic: "Behavioral Interviewing",
        resource: "STAR Method Guide",
        url: "https://www.themuse.com/advice/star-interview-method"
      }
    ],
    transcript: input.transcript,
    proctoringLog: input.proctoringLog,
    generatedAt: new Date().toISOString()
  };
};
