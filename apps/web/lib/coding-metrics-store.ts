import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

interface CodingAttempt {
  userId: string;
  language: string;
  passed: number;
  failed: number;
  executionMs: number;
  score: number;
  createdAt: string;
}

export interface CodingDashboardMetrics {
  totalAttempts: number;
  totalPassed: number;
  totalFailed: number;
  avgScore: number;
  bestScore: number;
  avgExecutionMs: number;
  lastAttemptAt?: string;
}

const getStoreFilePath = (): string => path.join(process.cwd(), ".data", "coding-attempts.json");

const readAttempts = (): CodingAttempt[] => {
  const filePath = getStoreFilePath();

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as CodingAttempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAttempts = (attempts: CodingAttempt[]): void => {
  const filePath = getStoreFilePath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(attempts, null, 2), "utf8");
};

export const recordCodingAttempt = (attempt: CodingAttempt): void => {
  const attempts = readAttempts();
  attempts.push(attempt);

  // Keep storage bounded to avoid unbounded growth.
  const bounded = attempts.slice(-2000);
  writeAttempts(bounded);
};

export const getCodingDashboardMetrics = (userId: string): CodingDashboardMetrics => {
  const attempts = readAttempts().filter((attempt) => attempt.userId === userId);

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      totalPassed: 0,
      totalFailed: 0,
      avgScore: 0,
      bestScore: 0,
      avgExecutionMs: 0
    };
  }

  const totalAttempts = attempts.length;
  const totalPassed = attempts.reduce((sum, attempt) => sum + attempt.passed, 0);
  const totalFailed = attempts.reduce((sum, attempt) => sum + attempt.failed, 0);
  const avgScore = Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts);
  const bestScore = attempts.reduce((max, attempt) => Math.max(max, attempt.score), 0);
  const avgExecutionMs = Math.round(attempts.reduce((sum, attempt) => sum + attempt.executionMs, 0) / totalAttempts);
  const lastAttemptAt = attempts.reduce((latest, attempt) => {
    if (!latest) return attempt.createdAt;
    return new Date(attempt.createdAt).getTime() > new Date(latest).getTime() ? attempt.createdAt : latest;
  }, "");

  return {
    totalAttempts,
    totalPassed,
    totalFailed,
    avgScore,
    bestScore,
    avgExecutionMs,
    ...(lastAttemptAt ? { lastAttemptAt } : {})
  };
};
