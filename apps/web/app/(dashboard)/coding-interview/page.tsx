"use client";

import type { CodingChallenge, CodingSessionResult, DifficultyLevel } from "@recruitai/shared";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { CodingSandbox } from "../../../components/interview/coding-sandbox";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

type Phase = "setup" | "loading" | "sandbox" | "done";

const DSA_TOPICS = [
  "DSA",
  "Arrays",
  "Strings",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Sorting"
] as const;

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];

export default function CodingInterviewPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState<string>("DSA");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [challenge, setChallenge] = useState<CodingChallenge | null>(null);
  const [result, setResult] = useState<CodingSessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const difficultyTone = useMemo(() => {
    if (difficulty === "easy") return "text-emerald-300";
    if (difficulty === "medium") return "text-amber-300";
    return "text-red-300";
  }, [difficulty]);

  const loadChallenge = useCallback(async () => {
    setPhase("loading");
    setError(null);

    try {
      const response = await fetch("/api/coding-interview/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty })
      });

      if (!response.ok) {
        throw new Error("Failed to create challenge");
      }

      const data = (await response.json()) as { challenge: CodingChallenge };
      setChallenge(data.challenge);
      setResult(null);
      setPhase("sandbox");
    } catch {
      setError("Unable to generate challenge right now. Please try again.");
      setPhase("setup");
    }
  }, [topic, difficulty]);

  const onComplete = useCallback((sessionResult: CodingSessionResult) => {
    setResult(sessionResult);
    setPhase("done");
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Coding Interview</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Practice DSA with timed coding challenges and instant test feedback.
          </p>
        </div>
        <span className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide ${difficultyTone}`}>
          {difficulty}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Choose DSA Topic</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {DSA_TOPICS.map((item) => (
                    <button
                      key={item}
                      onClick={() => setTopic(item)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                        topic === item
                          ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-100"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-200">Choose Difficulty</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DIFFICULTIES.map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`rounded-xl border px-3 py-2 text-sm capitalize transition ${
                        difficulty === level
                          ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-100"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={loadChallenge}>Start Coding Round</Button>
                <Button variant="secondary" onClick={() => { setTopic("DSA"); setDifficulty("medium"); }}>
                  Reset Choices
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="space-y-3">
              <p className="text-sm text-zinc-300">Preparing your {difficulty} {topic} challenge...</p>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {(phase === "sandbox" || phase === "done") && challenge && (
          <motion.div
            key="sandbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <CodingSandbox
              challenge={challenge}
              candidateName="Candidate"
              onComplete={onComplete}
            />

            {phase === "done" && result && (
              <Card className="space-y-2">
                <h2 className="text-lg font-semibold text-zinc-100">Round Summary</h2>
                <p className="text-sm text-zinc-300">
                  Passed {result.passed} / {result.passed + result.failed} tests in {result.executionMs}ms.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={loadChallenge}>Next Challenge</Button>
                  <Button variant="secondary" onClick={() => setPhase("setup")}>Change Topic or Difficulty</Button>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
