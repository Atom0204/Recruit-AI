import type { CodingSessionResult } from "@recruitai/shared";
import { NextRequest, NextResponse } from "next/server";

interface ExecutionRequest {
  code: string;
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
    const { code, language, testCases }: ExecutionRequest = await req.json();

    if (!code || !language || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Mock execution - In production, call external judge service
    const startTime = performance.now();

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    const executionMs = Math.round(performance.now() - startTime);

    // Mock test results based on code analysis
    const hasReturnStatement = code.includes("return") || code.includes("return");
    const hasSyntaxError = checkSyntaxError(code);
    const passed = hasReturnStatement && !hasSyntaxError;

    const result: CodingSessionResult = {
      passed: passed ? Math.floor(testCases.length * (0.8 + Math.random() * 0.2)) : 0,
      failed: passed ? Math.ceil(testCases.length * (0.2 - Math.random() * 0.2)) : testCases.length,
      executionMs,
      details: testCases.map((testCase, idx) => ({
        caseIndex: idx,
        passed: passed && Math.random() > 0.3,
        message: passed && Math.random() > 0.3 ? "✓ Test passed" : "✗ Test failed",
        expected: testCase.expectedOutput,
        actual: passed ? testCase.expectedOutput : "undefined or error"
      })),
      score: passed ? Math.round(80 + Math.random() * 20) : Math.round(Math.random() * 50),
      feedback: passed
        ? "Good solution! Consider optimizing for edge cases and performance."
        : "Code execution failed. Please review syntax and logic."
    };

    return NextResponse.json({
      success: true,
      result,
      warning: "This is a mock execution. In production, integrate with Judge0 or similar."
    });
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
