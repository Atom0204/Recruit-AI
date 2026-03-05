export type CodingLanguage = "typescript" | "javascript" | "python" | "java" | "cpp" | "rust" | "go" | "csharp";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type ChallengeCategory = "arrays" | "strings" | "trees" | "graphs" | "dp" | "sorting" | "system_design" | "database" | "web" | "algorithm";

export interface CodingChallenge {
  id: string;
  prompt: string;
  description: string;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  language: CodingLanguage;
  starterCode: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
  }>;
  timeLimit: number;
  subtopic: string;
  aiObservation: boolean;
  evaluationCriteria?: {
    correctness: number; // weight 0-1
    efficiency: number; // weight 0-1
    codeQuality: number; // weight 0-1
  };
}

export interface CodingSessionResult {
  passed: number;
  failed: number;
  executionMs: number;
  details: Array<{
    caseIndex: number;
    passed: boolean;
    message: string;
    expected?: string;
    actual?: string;
  }>;
  score?: number;
  feedback?: string;
}

export interface ResumeSkilledChallenge extends CodingChallenge {
  resumeSkillMatch: string; // Matched skill from resume
  suitabilityScore: number; // 0-1 based on resume fit
  reasoningBrief: string;
}
