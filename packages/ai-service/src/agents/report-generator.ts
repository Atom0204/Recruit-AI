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

/** Analyze candidate responses for communication quality. */
const analyzeCommunication = (transcript: TranscriptEntry[]): { wordCount: number; avgWordsPerAnswer: number; structureScore: number } => {
  const candidateEntries = transcript.filter((e) => e.speaker === "Candidate");
  const allText = candidateEntries.map((e) => e.text).join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const avgWordsPerAnswer = candidateEntries.length > 0 ? Math.round(wordCount / candidateEntries.length) : 0;

  // Structure: do they use organized, coherent arguments?
  const structureSignals = /\b(first|second|third|because|therefore|for example|specifically|as a result|to summarize|in conclusion|the trade-?off|my approach)\b/gi;
  const structureHits = (allText.match(structureSignals) ?? []).length;
  const structureScore = Math.min(100, structureHits * 8 + (avgWordsPerAnswer > 40 ? 10 : 0));

  return { wordCount, avgWordsPerAnswer, structureScore };
};

/** Generate per-question sentiment based on individual answer quality. */
const buildEmotionalArc = (
  transcript: TranscriptEntry[],
  categoryCount: number
): CandidateFitReport["sentimentAnalysis"]["emotionalArc"] => {
  // Group candidate answers by question (approximate: each AI message starts a new Q)
  const candidateAnswers: string[] = [];
  let currentAnswer = "";

  for (const entry of transcript) {
    if (entry.speaker === "AI") {
      if (currentAnswer.trim()) candidateAnswers.push(currentAnswer.trim());
      currentAnswer = "";
    } else {
      currentAnswer += " " + entry.text;
    }
  }
  if (currentAnswer.trim()) candidateAnswers.push(currentAnswer.trim());

  return Array.from({ length: categoryCount }, (_, idx) => {
    const answer = candidateAnswers[idx] ?? "";
    const words = answer.split(/\s+/).filter(Boolean).length;
    const hasStructure = /because|therefore|first|approach|solution/i.test(answer);
    const hasHesitation = /um+|uh+|i don'?t know|not sure|maybe|i think/i.test(answer);

    let confidence: number;
    let sentiment: "positive" | "neutral" | "anxious" | "confused";

    if (words < 5) {
      confidence = 30;
      sentiment = "confused";
    } else if (words < 20 && !hasStructure) {
      confidence = 45;
      sentiment = "anxious";
    } else if (hasHesitation && !hasStructure) {
      confidence = 55;
      sentiment = "anxious";
    } else if (hasStructure && words > 40) {
      confidence = 85;
      sentiment = "positive";
    } else {
      confidence = 68;
      sentiment = "neutral";
    }

    return { question: idx + 1, sentiment, confidence: clampScore(confidence) };
  });
};

/** Select recommended resources based on weak areas. */
const selectResources = (
  categoryScores: ReportInput["categoryScores"]
): CandidateFitReport["recommendedResources"] => {
  const resources: CandidateFitReport["recommendedResources"] = [];
  const weakCategories = categoryScores.filter((c) => c.score < 72).map((c) => c.category.toLowerCase());

  if (weakCategories.some((c) => c.includes("technical"))) {
    resources.push({
      topic: "Technical Interview Prep",
      resource: "NeetCode — Structured coding practice",
      url: "https://neetcode.io/"
    });
  }
  if (weakCategories.some((c) => c.includes("system"))) {
    resources.push({
      topic: "System Design",
      resource: "Designing Data-Intensive Applications — Martin Kleppmann",
      url: "https://dataintensive.net/"
    });
    resources.push({
      topic: "System Design Interview",
      resource: "ByteByteGo — Alex Xu",
      url: "https://bytebytego.com/"
    });
  }
  if (weakCategories.some((c) => c.includes("problem"))) {
    resources.push({
      topic: "Problem Solving",
      resource: "Cracking the Coding Interview — Gayle McDowell",
      url: "https://www.crackingthecodinginterview.com/"
    });
  }
  if (weakCategories.some((c) => c.includes("communication"))) {
    resources.push({
      topic: "Behavioral Interviewing",
      resource: "STAR Method Guide",
      url: "https://www.themuse.com/advice/star-interview-method"
    });
  }

  // Always include at least one resource
  if (resources.length === 0) {
    resources.push({
      topic: "Continuous Growth",
      resource: "The Pragmatic Programmer — Hunt & Thomas",
      url: "https://pragprog.com/titles/tpp20/"
    });
  }

  return resources;
};

export const generateCandidateReport = async (input: ReportInput): Promise<CandidateFitReport> => {
  const { wordCount, avgWordsPerAnswer, structureScore } = analyzeCommunication(input.transcript);

  // Weighted score calculation
  const weightedRaw = input.categoryScores.reduce((sum, item) => sum + item.score * item.weight, 0);

  // Communication quality bonus (up to +5 points)
  const commBonus = structureScore >= 60 ? 3 : structureScore >= 30 ? 1 : 0;
  const verbosityBonus = avgWordsPerAnswer >= 50 ? 2 : avgWordsPerAnswer >= 30 ? 1 : 0;

  // Proctoring penalty
  const proctoringPenalty = input.proctoringLog.reduce((sum, event) => sum + severityPenalty[event.severity], 0);
  const integrityDeduction = Math.min(20, proctoringPenalty * 0.8);

  const overallScore = clampScore(Math.round(weightedRaw + commBonus + verbosityBonus - integrityDeduction));

  // Confidence in our assessment
  const answerCount = input.transcript.filter((e) => e.speaker === "Candidate").length;
  let assessmentConfidence = 50;
  if (answerCount >= 8) assessmentConfidence += 20;
  else if (answerCount >= 5) assessmentConfidence += 12;
  if (wordCount > 500) assessmentConfidence += 10;
  if (structureScore > 40) assessmentConfidence += 8;
  if (proctoringPenalty > 0) assessmentConfidence -= Math.min(15, proctoringPenalty * 2);
  assessmentConfidence = clampScore(assessmentConfidence);

  const hasSeriousFlag = input.proctoringLog.some((event) => event.severity === "high");
  const proctoringFlags = [
    ...(input.proctoringLog.length > 0 ? [`${input.proctoringLog.length} proctoring event(s) recorded — review recommended`] : []),
    ...(hasSeriousFlag ? ["High-severity integrity violation detected — manual review required"] : [])
  ];

  const emotionalArc = buildEmotionalArc(input.transcript, input.categoryScores.length);

  const strengths = input.categoryScores.filter((x) => x.score >= 75).map((x) => x.category);
  const improvements = input.categoryScores.filter((x) => x.score < 70).map((x) => x.category);

  return {
    candidateName: input.candidateName,
    role: input.role,
    date: new Date().toISOString(),
    overallScore,
    verdict: deriveVerdict(overallScore),
    categoryScores: input.categoryScores,
    sentimentAnalysis: {
      overallConfidence: assessmentConfidence,
      emotionalArc,
      flags: proctoringFlags
    },
    areasOfStrength: strengths.length > 0 ? strengths : ["No standout area — further evaluation recommended"],
    areasForImprovement: improvements.length > 0 ? improvements : ["All categories met threshold"],
    recommendedResources: selectResources(input.categoryScores),
    transcript: input.transcript,
    proctoringLog: input.proctoringLog,
    generatedAt: new Date().toISOString()
  };
};
