"use client";

import { useState, useCallback } from "react";
import type { CodingChallenge, CodingSessionResult } from "@recruitai/shared";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Pill } from "../ui/pill";

interface CodingSandboxProps {
  challenge: CodingChallenge;
  candidateName: string;
  onComplete?: (result: CodingSessionResult) => void;
  onSubmit?: (code: string) => void;
  timeRemaining?: number | undefined;
}

export function CodingSandbox({ 
  challenge, 
  candidateName, 
  onComplete, 
  onSubmit, 
  timeRemaining 
}: CodingSandboxProps) {
  const [code, setCode] = useState(challenge.starterCode);
  const [result, setResult] = useState<CodingSessionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRunTests = useCallback(() => {
    setIsRunning(true);
    
    // Simulate execution
    setTimeout(() => {
      const mockResult: CodingSessionResult = {
        passed: Math.random() > 0.3 ? challenge.testCases.length : 0,
        failed: Math.random() > 0.3 ? 0 : challenge.testCases.length,
        executionMs: Math.floor(Math.random() * 1000),
        details: challenge.testCases.map((tc, idx) => ({
          caseIndex: idx,
          passed: Math.random() > 0.3,
          message: Math.random() > 0.3 ? "✓ Passed" : "✗ Failed",
          expected: tc.expectedOutput,
          actual: Math.random() > 0.3 ? tc.expectedOutput : "undefined"
        })),
        score: Math.round(Math.random() * 100),
        feedback: "Good effort! Check edge cases for improvement."
      };
      setResult(mockResult);
      setIsRunning(false);
    }, 800);
  }, [challenge.testCases]);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
    onSubmit?.(code);
    if (result) {
      onComplete?.(result);
    }
  }, [code, result, onComplete, onSubmit]);

  const getDifficultyVariant = (diff: string): "default" | "success" | "warning" | "danger" => {
    switch (diff.toLowerCase()) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="space-y-3 pb-3 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">
              {challenge.prompt.substring(0, 60)}...
            </h3>
            <p className="text-xs text-zinc-400">
              {challenge.subtopic || "Coding Challenge"}
            </p>
          </div>
          <Pill 
            label={challenge.difficulty.toUpperCase()} 
            variant={getDifficultyVariant(challenge.difficulty)} 
          />
        </div>

        {/* Info row */}
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <div>⏱️ Time Limit: {(challenge.timeLimit / 60).toFixed(0)} min</div>
          {timeRemaining !== undefined && <div>⏳ Remaining: {timeRemaining}s</div>}
          {challenge.aiObservation && <div>👁️ AI Observing</div>}
        </div>
      </div>

      {/* Code Editor (Simple textarea) */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-300">Code Editor</p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-64 rounded-xl border border-white/10 bg-zinc-950/50 p-4 font-mono text-sm text-zinc-200 resize-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 outline-none"
          placeholder="Write your code here..."
        />
      </div>

      {/* Test Cases */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-300">Test Cases</p>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {challenge.testCases.map((testCase, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs font-mono"
            >
              <div className="text-zinc-300">
                <span className="text-zinc-500">Test #{idx + 1}:</span>
                <br />
                <span className="text-zinc-400">input:</span>{" "}
                <span className="text-indigo-300">{testCase.input}</span>
              </div>
              <div className="mt-1 text-zinc-300">
                <span className="text-zinc-400">expected:</span>{" "}
                <span className="text-emerald-300">{testCase.expectedOutput}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-emerald-300">Test Results</h4>
            <span className="text-xs text-zinc-400">{result.executionMs}ms</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-zinc-400">Passed</p>
              <p className="text-2xl font-bold text-emerald-400">{result.passed}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-zinc-400">Failed</p>
              <p className="text-2xl font-bold text-red-400">{result.failed}</p>
            </div>
          </div>
          {result.feedback && (
            <p className="text-xs text-zinc-300 italic">{result.feedback}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-3 border-t border-white/10">
        <Button
          onClick={handleRunTests}
          disabled={isRunning}
          variant="secondary"
          className="flex-1"
        >
          {isRunning ? "Running..." : "Run Tests"} ▶️
        </Button>
        <Button
          onClick={() => setCode(challenge.starterCode)}
          variant="secondary"
          className="flex-1"
        >
          Reset Code
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!result || isSubmitted}
          className="flex-1"
        >
          {isSubmitted ? "Submitted ✓" : "Submit Code"} 🚀
        </Button>
      </div>

      {/* Proctoring note */}
      {challenge.aiObservation && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-3 py-2 text-xs text-amber-200">
          👁️ Your code and input patterns are being monitored by AI proctoring for authenticity verification.
        </div>
      )}
    </Card>
  );
}
