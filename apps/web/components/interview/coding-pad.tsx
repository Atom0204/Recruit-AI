"use client";

import { useMemo, useState } from "react";
import type { CodingChallenge } from "@recruitai/shared";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

const defaultChallenge: CodingChallenge = {
  prompt: "Implement a function that returns top-k candidates by weighted score.",
  language: "typescript",
  starterCode: `export function topKCandidates(scores: number[], k: number): number[] {\n  return [];\n}`,
  testCases: [
    { input: "[91,88,77],2", expectedOutput: "[91,88]" },
    { input: "[60,72,65,81],3", expectedOutput: "[81,72,65]" }
  ],
  timeLimit: 900,
  aiObservation: true
};

export function CodingPad() {
  const [code, setCode] = useState(defaultChallenge.starterCode);
  const [result, setResult] = useState<string>("Not executed");

  const testsText = useMemo(
    () => defaultChallenge.testCases.map((test, idx) => `#${idx + 1}: in ${test.input} -> ${test.expectedOutput}`).join("\n"),
    []
  );

  return (
    <Card>
      <h3 className="mb-2 text-base font-semibold">Interactive Coding</h3>
      <p className="text-sm text-zinc-300">{defaultChallenge.prompt}</p>
      <textarea
        aria-label="coding-editor"
        className="mt-3 h-40 w-full rounded-xl border border-white/10 bg-zinc-950/70 p-3 font-mono text-xs text-zinc-200"
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
      <pre className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-zinc-950/70 p-3 text-xs text-zinc-400">{testsText}</pre>
      <div className="mt-3 flex items-center justify-between">
        <Button
          onClick={() => {
            setResult(code.includes("return") ? "2/2 mock tests passed" : "0/2 mock tests passed");
          }}
        >
          Run Tests
        </Button>
        <span className="text-xs text-zinc-300">{result}</span>
      </div>
    </Card>
  );
}
