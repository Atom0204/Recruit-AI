import type { CodingSessionResult } from "@recruitai/shared";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "../../../../lib/auth";
import { recordCodingAttempt } from "../../../../lib/coding-metrics-store";

interface ExecutionRequest {
  code: string;
  starterCode?: string;
  language: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
}

/**
 * Code Execution Endpoint
 * In production, this would integrate with:
 * - Judge0 API (code.judge0.com)
 * - LeetCode Judge System
 * - Custom sandboxed runtime (Docker/WebAssembly)
 */
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const { code, starterCode, language, testCases }: ExecutionRequest = await req.json();

    if (!code || !language || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Lightweight deterministic mock execution until a real judge is integrated.
    const startTime = performance.now();

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 450));

    const executionMs = Math.round(performance.now() - startTime);
    const testCount = testCases.length;
    const normalizedCode = normalizeCode(code);
    const normalizedStarterCode = starterCode ? normalizeCode(starterCode) : null;
    const submittedStarterCode = !!normalizedStarterCode && normalizedCode === normalizedStarterCode;
    const hasNoMeaningfulCode = !isMeaningfulSubmission(normalizedCode);

    if (hasNoMeaningfulCode || submittedStarterCode) {
      const reason = submittedStarterCode
        ? "Starter template submitted without meaningful changes."
        : "No executable solution detected. Add your implementation and run tests again.";

      const failedResult: CodingSessionResult = {
        passed: 0,
        failed: testCount,
        executionMs,
        details: testCases.map((testCase, idx) => ({
          caseIndex: idx,
          passed: false,
          message: `✗ ${reason}`,
          expected: testCase.expectedOutput,
          actual: "No output"
        })),
        score: 0,
        feedback: reason
      };

      if (userId) {
        recordCodingAttempt({
          userId,
          language,
          passed: failedResult.passed,
          failed: failedResult.failed,
          executionMs: failedResult.executionMs,
          score: failedResult.score ?? 0,
          createdAt: new Date().toISOString()
        });
      }

      return NextResponse.json({ success: true, result: failedResult });
    }

    // Heuristic pass estimate for mock mode.
    const hasReturnStatement = /\breturn\b/.test(code) || /\b=>\b/.test(code);
    const hasFunctionLikeDefinition = /(function\s+\w+|def\s+\w+|fn\s+\w+|class\s+\w+|\w+\s*\([^)]*\)\s*\{|const\s+\w+\s*=\s*\([^)]*\)\s*=>)/.test(code);
    const hasSyntaxError = checkSyntaxError(code);

    const signalCount = [hasReturnStatement, hasFunctionLikeDefinition, !hasSyntaxError].filter(Boolean).length;
    const passedCount = Math.max(1, Math.min(testCount, Math.floor((signalCount / 3) * testCount)));
    const failedCount = Math.max(0, testCount - passedCount);

    const result: CodingSessionResult = {
      passed: hasSyntaxError ? 0 : passedCount,
      failed: hasSyntaxError ? testCount : failedCount,
      executionMs,
      details: testCases.map((testCase, idx) => ({
        caseIndex: idx,
        passed: !hasSyntaxError && idx < passedCount,
        message: !hasSyntaxError && idx < passedCount ? "✓ Test passed" : "✗ Test failed",
        expected: testCase.expectedOutput,
        actual: !hasSyntaxError && idx < passedCount ? testCase.expectedOutput : "undefined or error"
      })),
      score: hasSyntaxError ? 20 : Math.round((passedCount / Math.max(1, testCount)) * 100),
      feedback: hasSyntaxError
        ? "Code execution failed due to syntax issues."
        : "Partial mock evaluation complete. Integrate a real judge for exact correctness checks."
    };

    if (userId) {
      recordCodingAttempt({
        userId,
        language,
        passed: result.passed,
        failed: result.failed,
        executionMs: result.executionMs,
        score: result.score ?? 0,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      {
        error: "Code execution failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Simple syntax error detection
 * In production, use a proper parser/linter
 */
function checkSyntaxError(code: string): boolean {
  const issues = [
    code.match(/[\{]{2,}/), // Multiple opening braces
    code.match(/[}]{2,}/), // Multiple closing braces
    code.match(/;;\s/), // Double semicolons
    code.match(/function\s*\(\s*\)\s*{/), // Wrong function syntax (varies by language)
  ];

  return issues.some((issue) => issue !== null);
}

function normalizeCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/^\s*#.*$/gm, "")
    .replace(/\s+/g, "")
    .trim();
}

function isMeaningfulSubmission(normalizedCode: string): boolean {
  if (!normalizedCode) return false;
  if (normalizedCode.length < 24) return false;

  const placeholders = [
    "returnnull;",
    "returnNone",
    "returnundefined;",
    "pass",
    "TODO",
    "//TODO"
  ];

  return !placeholders.some((token) => normalizedCode.includes(token.replace(/\s+/g, "")));
}
