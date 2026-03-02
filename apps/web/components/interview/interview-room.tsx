"use client";

import { decideBranch } from "@recruitai/ai-service";
import { createTabSwitchEvent } from "@recruitai/proctoring-service";
import type { CandidateResponse, InterviewQuestion, InterviewState, ProctoringEvent, TranscriptEntry } from "@recruitai/shared";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useInterviewTimer } from "../../hooks/use-interview-timer";
import { ProctoringOverlay } from "../proctoring/proctoring-overlay";
import { CodingPad } from "./coding-pad";

interface InterviewRoomProps {
  interviewId: string;
  candidateName: string;
  role: string;
  questions: InterviewQuestion[];
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }

  interface SpeechRecognitionEvent extends Event {
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string;
        };
        isFinal: boolean;
      };
      length: number;
    };
  }
}

const buildState = (
  questions: InterviewQuestion[],
  currentQuestionIndex: number,
  responses: CandidateResponse[]
): InterviewState => ({
  currentQuestionIndex,
  questions,
  responses,
  confidenceTracker: [],
  branchHistory: [],
  overallTrajectory: "stable"
});

export function InterviewRoom({ interviewId, candidateName, role, questions }: InterviewRoomProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [candidateDraft, setCandidateDraft] = useState("");
  const [candidateResponses, setCandidateResponses] = useState<CandidateResponse[]>([]);
  const [proctoringLog, setProctoringLog] = useState<ProctoringEvent[]>([]);
  const [lastBranchMessage, setLastBranchMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interviewLocked, setInterviewLocked] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [fatalViolation, setFatalViolation] = useState(false);
  const { elapsedSeconds, remainingSeconds } = useInterviewTimer(45 * 60);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const askedAtRef = useRef<number>(Date.now());
  const startedRef = useRef(false);

  const currentQuestion = questions[currentQuestionIndex];

  const formattedElapsed = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(elapsedSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  const formattedRemaining = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(remainingSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingSeconds]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  const addTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscript((previous) => [...previous, entry]);
  }, []);

  const askCurrentQuestion = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

    const text = currentQuestion.prompt;
    addTranscript({
      speaker: "AI",
      text,
      timestamp: new Date().toISOString()
    });
    askedAtRef.current = Date.now();
    speak(text);
  }, [addTranscript, currentQuestion, speak]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    askCurrentQuestion();
  }, [askCurrentQuestion]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const RecognitionClass = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!RecognitionClass) {
      return;
    }

    const recognition = new RecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const nextText: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        nextText.push(event.results[index]?.[0]?.transcript ?? "");
      }
      setCandidateDraft(nextText.join(" ").trim());
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const logViolation = useCallback((details: string) => {
    const event = createTabSwitchEvent();
    setInterviewLocked(true);

    setTabViolations((previous) => {
      const violationCount = previous + 1;
      const severity: ProctoringEvent["severity"] = violationCount >= 2 ? "high" : "medium";

      setProctoringLog((existing) => [
        ...existing,
        {
          ...event,
          severity,
          details
        }
      ]);

      if (violationCount >= 2) {
        setFatalViolation(true);
      }

      return violationCount;
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || fatalViolation) {
      return;
    }

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        logViolation("Candidate left interview tab during active session.");
      }
    };

    const onBlur = () => {
      logViolation("Window focus left during active interview.");
    };

    const onPaste = () => {
      setProctoringLog((previous) => [
        ...previous,
        {
          timestamp: new Date().toISOString(),
          type: "CLIPBOARD_PASTE",
          severity: "medium",
          details: "Clipboard paste detected while interview is active."
        }
      ]);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("paste", onPaste);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("paste", onPaste);
    };
  }, [fatalViolation, logViolation]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.start();
    setIsListening(true);
  };

  const submitAnswer = () => {
    const text = candidateDraft.trim();
    if (!text || !currentQuestion) {
      return;
    }

    const timestamp = new Date().toISOString();
    const response: CandidateResponse = {
      questionId: currentQuestion.id,
      text,
      timestamp,
      responseLatencyMs: Date.now() - askedAtRef.current
    };

    const nextResponses = [...candidateResponses, response];
    setCandidateResponses(nextResponses);
    addTranscript({ speaker: "Candidate", text, timestamp });
    setCandidateDraft("");

    const decision = decideBranch(buildState(questions, currentQuestionIndex, nextResponses), response);
    setLastBranchMessage(decision.type === "FOLLOW_UP" ? "Adaptive follow-up generated." : decision.reason);

    if (decision.type === "FOLLOW_UP") {
      addTranscript({
        speaker: "AI",
        text: decision.question,
        timestamp: new Date().toISOString()
      });
      askedAtRef.current = Date.now();
      speak(decision.question);
      setLastBranchMessage("AI requested a follow-up for deeper signal.");
      return;
    }

    const nextIndex = Math.min(currentQuestionIndex + 1, questions.length - 1);
    const hasMore = nextIndex > currentQuestionIndex;
    setCurrentQuestionIndex(nextIndex);

    if (hasMore) {
      const nextPrompt = questions[nextIndex]?.prompt;
      if (nextPrompt) {
        addTranscript({ speaker: "AI", text: nextPrompt, timestamp: new Date().toISOString() });
        askedAtRef.current = Date.now();
        speak(nextPrompt);
      }
      return;
    }

    addTranscript({
      speaker: "AI",
      text: "Interview questions are complete. Please end the interview to generate your report.",
      timestamp: new Date().toISOString()
    });
  };

  const endInterview = useCallback(async () => {
    if (isFinishing) {
      return;
    }

    setIsFinishing(true);
    const response = await fetch(`/api/interview/${interviewId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, proctoringLog })
    });

    if (!response.ok) {
      setIsFinishing(false);
      return;
    }

    router.push(`/report/${interviewId}`);
  }, [interviewId, isFinishing, proctoringLog, router, transcript]);

  useEffect(() => {
    if (!fatalViolation) {
      return;
    }

    setCandidateDraft("Interview locked due to integrity policy violations.");
    void endInterview();
  }, [endInterview, fatalViolation]);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="relative min-h-[480px] overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Live Candidate Feed</h2>
          <span className="text-xs text-zinc-300">Interview #{interviewId}</span>
        </div>
        <div className="grid-overlay relative flex min-h-[320px] items-center justify-center rounded-xl border border-white/10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-400/10"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          />
          <span className="text-sm text-zinc-300">Camera + mic stream active for {candidateName}</span>
        </div>
        <ProctoringOverlay proctoringLog={proctoringLog} tabViolations={tabViolations} interviewLocked={interviewLocked} />

        <AnimatePresence>
          {interviewLocked ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/90 p-6"
            >
              <div className="max-w-md rounded-2xl border border-rose-400/40 bg-rose-500/10 p-5 text-center">
                <p className="text-sm font-semibold text-rose-200">Interview Integrity Lock</p>
                <p className="mt-2 text-xs text-zinc-300">
                  Tab change detected. Return to this tab and continue without switching windows. Multiple violations auto-end the interview.
                </p>
                {!fatalViolation ? (
                  <Button className="mt-4" onClick={() => setInterviewLocked(false)}>
                    Resume Interview
                  </Button>
                ) : (
                  <p className="mt-4 text-xs text-rose-200">Session is ending due to repeated integrity violations.</p>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold">AI Recruiter · {role}</h3>
            <span className="text-xs text-zinc-300">Elapsed {formattedElapsed}</span>
          </div>
          <p className="text-sm text-zinc-200">{currentQuestion?.prompt ?? "No question available."}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
            <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
            <span>Remaining {formattedRemaining}</span>
          </div>

          <div className="mt-4 space-y-2">
            <textarea
              value={candidateDraft}
              onChange={(event) => setCandidateDraft(event.target.value)}
              placeholder="Candidate answer appears here. Voice transcript can be edited before submission."
              className="h-28 w-full rounded-xl border border-white/15 bg-zinc-950/70 p-3 text-sm text-zinc-100 outline-none ring-indigo-300/40 transition focus:ring"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant={isListening ? "secondary" : "ghost"} onClick={toggleListening} disabled={fatalViolation}>
                {isListening ? "Stop Voice Capture" : "Start Voice Capture"}
              </Button>
              <Button onClick={submitAnswer} disabled={!candidateDraft.trim() || fatalViolation}>
                Submit Answer
              </Button>
              <Button variant="ghost" onClick={askCurrentQuestion}>
                Replay AI Question
              </Button>
              <Button variant="ghost" onClick={() => setVoiceEnabled((value) => !value)}>
                Voice {voiceEnabled ? "On" : "Off"}
              </Button>
              <Button variant="ghost" onClick={endInterview} disabled={isFinishing}>
                {isFinishing ? "Processing..." : "End Interview"}
              </Button>
            </div>
            {lastBranchMessage ? <p className="text-xs text-indigo-200">Adaptive branch: {lastBranchMessage}</p> : null}
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 text-base font-semibold">Live Transcript</h3>
          <div className="max-h-[180px] space-y-2 overflow-y-auto pr-2 text-sm">
            {transcript.length === 0 ? <p className="text-zinc-400">Transcript starts when session begins.</p> : null}
            {transcript.map((entry, index) => (
              <motion.p
                key={`${entry.timestamp}-${index}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={entry.speaker === "AI" ? "text-zinc-200" : "text-emerald-100"}
              >
                <span className="text-indigo-300">{entry.speaker}:</span> {entry.text}
              </motion.p>
            ))}
          </div>
        </Card>

        <CodingPad />
      </div>
    </section>
  );
}
