export type InterviewQuestionType =
  | "icebreaker"
  | "technical"
  | "system_design"
  | "problem_solving"
  | "culture_fit"
  | "follow_up"
  | "coding";

export interface InterviewQuestion {
  id: string;
  type: InterviewQuestionType;
  prompt: string;
  expectedSignals: string[];
  difficulty: number;
  timeLimitSeconds: number;
}

export interface CandidateResponse {
  questionId: string;
  text: string;
  timestamp: string;
  responseLatencyMs: number;
}

export type BranchDecision =
  | { type: "PROBE_DEEPER"; reason: string }
  | { type: "SIMPLIFY"; reason: string }
  | { type: "PIVOT_TOPIC"; newTopic: string; reason: string }
  | { type: "FOLLOW_UP"; question: string }
  | { type: "PROCEED"; reason: string };

export interface InterviewState {
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  responses: CandidateResponse[];
  confidenceTracker: number[];
  branchHistory: BranchDecision[];
  overallTrajectory: "improving" | "stable" | "declining";
}

export interface TranscriptEntry {
  speaker: "AI" | "Candidate";
  text: string;
  timestamp: string;
}
