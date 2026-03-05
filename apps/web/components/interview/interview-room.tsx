"use client";

import { decideBranch } from "@recruitai/ai-service";
import { createTabSwitchEvent } from "@recruitai/proctoring-service";
import type { CandidateResponse, InterviewQuestion, InterviewState, ProctoringEvent, TranscriptEntry, CodingChallenge } from "@recruitai/shared";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useInterviewTimer } from "../../hooks/use-interview-timer";
import { CodingQuestionRenderer } from "./coding-question-renderer";

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

/* ============================================================
   Audio Waveform Visualizer component
   ============================================================ */
function AudioWaveform({ active, color = "indigo" }: { active: boolean; color?: "indigo" | "emerald" }) {
  const bars = 12;
  const c = color === "indigo" ? "bg-indigo-400" : "bg-emerald-400";
  return (
    <div className="flex items-end gap-[3px] h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-full ${active ? c : "bg-zinc-600"}`}
          animate={
            active
              ? { height: [6, 14 + Math.random() * 16, 6], transition: { duration: 0.5 + Math.random() * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 } }
              : { height: 4 }
          }
        />
      ))}
    </div>
  );
}

/* ============================================================
   Proctoring Status Bar
   ============================================================ */
function ProctoringBar({ violations, locked }: { violations: number; locked: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px]">
      <div className="flex items-center gap-1.5">
        <span className={`status-dot ${violations === 0 ? "status-dot-live" : "status-dot-danger"}`} />
        <span className="text-zinc-400">Proctoring</span>
      </div>
      <span className="h-3 w-px bg-white/[0.08]" />
      <span className={violations > 0 ? "text-red-300" : "text-zinc-400"}>
        Tab: {violations > 0 ? `${violations} violation${violations > 1 ? "s" : ""}` : "Clear"}
      </span>
      <span className="h-3 w-px bg-white/[0.08]" />
      <span className="text-zinc-400">Focus: {locked ? "🔒 Locked" : "✓ Active"}</span>
      <span className="h-3 w-px bg-white/[0.08]" />
      <span className="text-zinc-400">Audio: Monitored</span>
    </div>
  );
}

/* ============================================================
   Main Interview Room
   ============================================================ */
export function InterviewRoom({ interviewId, candidateName, role, questions }: InterviewRoomProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [candidateDraft, setCandidateDraft] = useState("");
  const [candidateResponses, setCandidateResponses] = useState<CandidateResponse[]>([]);
  const [proctoringLog, setProctoringLog] = useState<ProctoringEvent[]>([]);
  const [lastBranchMessage, setLastBranchMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interviewLocked, setInterviewLocked] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [fatalViolation, setFatalViolation] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [codingChallenges, setCodingChallenges] = useState<CodingChallenge[]>([]);
  const { elapsedSeconds, remainingSeconds } = useInterviewTimer(45 * 60);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const askedAtRef = useRef<number>(Date.now());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const formattedElapsed = useMemo(() => {
    const m = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(elapsedSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [elapsedSeconds]);

  const formattedRemaining = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(remainingSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remainingSeconds]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Pick a high-quality English voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Karen"))
      );
      if (preferred) utterance.voice = preferred;

      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  const addTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscript((previous) => [...previous, entry]);
  }, []);

  const askCurrentQuestion = useCallback(() => {
    if (!currentQuestion) return;
    const text = currentQuestion.prompt;
    addTranscript({ speaker: "AI", text, timestamp: new Date().toISOString() });
    askedAtRef.current = Date.now();
    speak(text);
  }, [addTranscript, currentQuestion, speak]);

  // Pre-load voices on mount (no speech yet — that requires a user gesture)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const syn = window.speechSynthesis;
    const check = () => {
      if (syn.getVoices().length > 0) setVoicesReady(true);
    };
    check();
    syn.addEventListener("voiceschanged", check);
    return () => syn.removeEventListener("voiceschanged", check);
  }, []);

  // Called from the "Begin" button — runs inside a click handler so
  // the browser treats speechSynthesis.speak() as user-initiated.
  const beginInterview = useCallback(() => {
    setHasStarted(true);
    // Tiny warm-up utterance (silent) to unlock the speech engine
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const warmup = new SpeechSynthesisUtterance("");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
    }
    // Short delay so the warm-up registers before real speech
    setTimeout(() => askCurrentQuestion(), 300);
  }, [askCurrentQuestion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const RecognitionClass = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!RecognitionClass) return;

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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  // Anti-cheat listeners
  const logViolation = useCallback((details: string) => {
    const event = createTabSwitchEvent();
    setInterviewLocked(true);
    setTabViolations((previous) => {
      const violationCount = previous + 1;
      const severity: ProctoringEvent["severity"] = violationCount >= 2 ? "high" : "medium";
      setProctoringLog((existing) => [...existing, { ...event, severity, details }]);
      if (violationCount >= 2) setFatalViolation(true);
      return violationCount;
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || fatalViolation) return;

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        logViolation("Candidate left interview tab during active session.");
      }
    };
    const onBlur = () => logViolation("Window focus left during active interview.");
    const onPaste = () => {
      setProctoringLog((previous) => [...previous, {
        timestamp: new Date().toISOString(),
        type: "CLIPBOARD_PASTE",
        severity: "medium",
        details: "Clipboard paste detected while interview is active."
      }]);
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
    if (!recognition) return;
    if (isListening) { recognition.stop(); setIsListening(false); return; }
    recognition.start();
    setIsListening(true);
  };

  const submitAnswer = () => {
    const text = candidateDraft.trim();
    if (!text || !currentQuestion) return;

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

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const decision = decideBranch(buildState(questions, currentQuestionIndex, nextResponses), response);
    setLastBranchMessage(decision.type === "FOLLOW_UP" ? "Adaptive follow-up generated." : decision.reason);

    if (decision.type === "FOLLOW_UP") {
      addTranscript({ speaker: "AI", text: decision.question, timestamp: new Date().toISOString() });
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
      text: "That completes all the interview questions. You may now end the session to receive your report.",
      timestamp: new Date().toISOString()
    });
  };

  const endInterview = useCallback(async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    window.speechSynthesis?.cancel();

    const response = await fetch(`/api/interview/${interviewId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, proctoringLog })
    });

    if (!response.ok) { setIsFinishing(false); return; }
    router.push(`/report/${interviewId}`);
  }, [interviewId, isFinishing, proctoringLog, router, transcript]);

  useEffect(() => {
    if (!fatalViolation) return;
    setCandidateDraft("Interview terminated due to integrity policy violations.");
    void endInterview();
  }, [endInterview, fatalViolation]);

  /* ── "Begin Interview" gate — satisfies browser user-gesture requirement ── */
  if (!hasStarted) {
    return (
      <div className="flex h-[calc(100dvh-56px)] items-center justify-center bg-interview">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-white/[0.08] bg-surface-1 p-10 text-center shadow-glow"
        >
          {/* Animated avatar */}
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-glow"
          >
            <span className="text-2xl font-bold text-white">AI</span>
          </motion.div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Ready to begin?</h2>
            <p className="mt-1 text-sm text-zinc-400">Role: <span className="text-zinc-200">{role}</span></p>
            <p className="mt-0.5 text-sm text-zinc-400">{questions.length} questions &middot; ~45 min</p>
          </div>

          <ul className="w-full space-y-2 text-left text-xs text-zinc-400">
            <li className="flex items-center gap-2"><span className="text-emerald-400">●</span> Allow microphone access when prompted</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">●</span> Stay on this tab — switching triggers a violation</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">●</span> Speak clearly; the AI interviewer will listen</li>
          </ul>

          <button
            onClick={beginInterview}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98]"
          >
            {voicesReady ? "Begin Interview" : "Loading voices…"}
          </button>

          <p className="text-[10px] text-zinc-500">Candidate: {candidateName}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col gap-0 overflow-hidden">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.01] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-dot-live" />
            <span className="text-xs font-medium text-zinc-200">Live Interview</span>
          </div>
          <span className="text-[10px] text-zinc-500">#{interviewId.slice(0, 8)}</span>
        </div>

        <ProctoringBar violations={tabViolations} locked={interviewLocked} />

        <div className="flex items-center gap-3">
          <div className="timer-display rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
            {formattedElapsed} <span className="text-zinc-500">/</span> {formattedRemaining}
          </div>
          <span className="text-xs text-zinc-400">
            Q{currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Main interview area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: video / avatar panels */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="grid flex-1 grid-cols-2 gap-3">
            {/* AI Interviewer panel */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.03]">
              <div className="orb w-[200px] h-[200px] bg-indigo-500/20 top-0 left-0" style={{ filter: "blur(60px)" }} />
              <motion.div
                animate={isSpeaking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-glow"
              >
                <span className="text-2xl font-bold text-white">AI</span>
              </motion.div>
              <p className="relative z-10 mt-3 text-sm font-medium text-zinc-200">AI Interviewer</p>
              <p className="relative z-10 text-xs text-zinc-400">{role}</p>

              <div className="relative z-10 mt-3">
                <AudioWaveform active={isSpeaking} color="indigo" />
              </div>

              {isSpeaking && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-black/40 px-3 py-2 text-center text-xs text-zinc-200 backdrop-blur-sm"
                >
                  Speaking...
                </motion.p>
              )}
            </div>

            {/* Candidate panel */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="grid-overlay absolute inset-0 opacity-30" />
              <motion.div
                animate={isListening ? { boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 30px rgba(16,185,129,0.3)", "0 0 0px rgba(16,185,129,0)"] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400"
              >
                <span className="text-lg font-bold text-white">{candidateName.charAt(0).toUpperCase()}</span>
              </motion.div>
              <p className="relative z-10 mt-3 text-sm font-medium text-zinc-200">{candidateName}</p>
              <p className="relative z-10 text-xs text-zinc-400">Candidate</p>

              <div className="relative z-10 mt-3">
                <AudioWaveform active={isListening} color="emerald" />
              </div>

              {isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-black/40 px-3 py-2 text-center text-xs text-emerald-300 backdrop-blur-sm"
                >
                  🎙 Listening...
                </motion.p>
              )}
            </div>
          </div>

          {/* Control bar — Zoom-style bottom strip */}
          <div className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <button
              onClick={toggleListening}
              disabled={fatalViolation}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                isListening
                  ? "bg-emerald-500 text-white shadow-glow-success pulse-ring relative"
                  : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
              } disabled:opacity-30`}
              title={isListening ? "Stop recording" : "Start recording"}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>

            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                voiceEnabled
                  ? "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
                  : "bg-red-500/20 text-red-300"
              }`}
              title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
            >
              {voiceEnabled ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75a.75.75 0 01-.75-.75V6a.75.75 0 011.5 0v12a.75.75 0 01-.75.75z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V18.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
            </button>

            <span className="mx-2 h-6 w-px bg-white/[0.08]" />

            <Button size="sm" onClick={submitAnswer} disabled={!candidateDraft.trim() || fatalViolation}>
              Submit Answer
            </Button>

            <Button size="sm" variant="secondary" onClick={askCurrentQuestion}>
              Replay Question
            </Button>

            <span className="mx-2 h-6 w-px bg-white/[0.08]" />

            <Button
              size="sm"
              variant="danger"
              onClick={endInterview}
              disabled={isFinishing}
            >
              {isFinishing ? "Ending..." : "End Interview"}
            </Button>
          </div>
        </div>

        {/* Right sidebar: current Q + transcript + answer OR coding challenge */}
        <div className="hidden w-[360px] shrink-0 flex-col border-l border-white/[0.06] bg-white/[0.01] lg:flex">
          {/* Check if current question is a coding challenge */}
          {(currentQuestion?.type === "coding") && codingChallenges.length > 0 && codingChallenges[0] ? (
            // Coding Challenge Renderer
            <CodingQuestionRenderer
              challenge={codingChallenges[0]}
              onComplete={(result) => {
                // Log the coding result
                console.log("Coding challenge completed:", result);
                submitAnswer(); // Move to next question
              }}
              onSkip={submitAnswer}
              timeRemaining={remainingSeconds}
            />
          ) : (
            // Regular Q&A Interface
            <>
              {/* Current question */}
              <div className="shrink-0 border-b border-white/[0.06] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-indigo-400">Current Question</p>
                  <span className="text-[10px] text-zinc-500">Q{currentQuestionIndex + 1}/{questions.length}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">{currentQuestion?.prompt ?? "No question available."}</p>

                {lastBranchMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 rounded-lg bg-indigo-500/[0.08] px-2.5 py-1.5"
                  >
                    <p className="text-[11px] text-indigo-300">⚡ {lastBranchMessage}</p>
                  </motion.div>
                )}
              </div>

              {/* Transcript */}
              <div className="flex-1 overflow-y-auto scroll-fade p-4">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">Live Transcript</p>
                {transcript.length === 0 && (
                  <p className="text-xs text-zinc-500">Interview will begin shortly...</p>
                )}
                <div className="space-y-2.5">
                  {transcript.map((entry, index) => (
                    <motion.div
                      key={`${entry.timestamp}-${index}`}
                      initial={{ opacity: 0, x: entry.speaker === "AI" ? -8 : 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        entry.speaker === "AI"
                          ? "bg-indigo-500/[0.08] text-zinc-200"
                          : "bg-emerald-500/[0.06] text-zinc-200"
                      }`}
                    >
                      <span className={`font-medium ${entry.speaker === "AI" ? "text-indigo-400" : "text-emerald-400"}`}>
                        {entry.speaker === "AI" ? "Interviewer" : "You"}
                      </span>
                      <p className="mt-0.5">{entry.text}</p>
                    </motion.div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </div>

              {/* Answer input */}
              <div className="shrink-0 border-t border-white/[0.06] p-4">
                <div className="relative">
                  <textarea
                    value={candidateDraft}
                    onChange={(e) => setCandidateDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
                    }}
                    placeholder={isListening ? "Listening to your voice..." : "Type your answer or use voice..."}
                    className="h-20 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 pr-10 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                  />
                  {isListening && (
                    <div className="absolute right-3 top-3">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-zinc-500">Press Enter to submit · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Integrity lock overlay */}
      <AnimatePresence>
        {interviewLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-4 max-w-md rounded-3xl border border-red-400/30 bg-surface-1 p-8 text-center glow-danger"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">Interview Integrity Warning</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Tab switching was detected. Please stay on this tab during the interview. Multiple violations will automatically end your session.
              </p>
              <p className="mt-2 text-xs text-red-300/80">
                Violations recorded: {tabViolations}
              </p>
              {!fatalViolation ? (
                <Button className="mt-5" onClick={() => setInterviewLocked(false)}>
                  I Understand — Resume Interview
                </Button>
              ) : (
                <p className="mt-5 text-sm font-medium text-red-300">Session ending due to repeated violations...</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
