export interface CodingChallenge {
  prompt: string;
  language: string;
  starterCode: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
  timeLimit: number;
  aiObservation: boolean;
}

export interface CodingSessionResult {
  passed: number;
  failed: number;
  executionMs: number;
  details: Array<{ caseIndex: number; passed: boolean; message: string }>;
}
