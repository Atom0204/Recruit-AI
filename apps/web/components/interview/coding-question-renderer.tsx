"use client";

import type { CodingChallenge, CodingSessionResult } from "@recruitai/shared";
import { useState, useCallback } from "react";
import { Card } from "../ui/card";
import { CodingSandbox } from "./coding-sandbox";

interface CodingQuestionRendererProps {
  challenge: CodingChallenge;
  onComplete: (result: CodingSessionResult) => void;
  onSkip: () => void;
  timeRemaining: number | undefined;
}

export function CodingQuestionRenderer({
  challenge,
  onComplete,
  onSkip,
  timeRemaining
}: CodingQuestionRendererProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleComplete = useCallback((result: CodingSessionResult) => {
    setIsSubmitted(true);
    onComplete(result);
  }, [onComplete]);

  return (
    <div className="space-y-4">
      {/* Replace the transcript panel with coding sandbox */}
      <CodingSandbox
        challenge={challenge}
        candidateName="Candidate"
        onComplete={handleComplete}
        timeRemaining={timeRemaining}
      />

      {/* Skip button */}
      {!isSubmitted && (
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-xs text-zinc-400 hover:text-zinc-300 transition px-3 py-2"
          >
            Skip this challenge →
          </button>
        </div>
      )}

      {isSubmitted && (
        <Card className="text-center py-4">
          <p className="text-sm text-emerald-300">✓ Challenge submitted!</p>
          <p className="text-xs text-zinc-500 mt-1">Continue with next question</p>
        </Card>
      )}
    </div>
  );
}
