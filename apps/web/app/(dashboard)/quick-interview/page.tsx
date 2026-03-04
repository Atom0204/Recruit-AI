"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";

/* ─── Types ─── */
interface Question {
  id: number;
  question: string;
  expectedAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  subtopic: string;
}

interface QuestionResult {
  questionId: number;
  correctness: number;
  completeness: number;
  clarity: number;
  score: number;
  feedback: string;
  isCorrect: boolean;
}

interface Evaluation {
  questionResults: QuestionResult[];
  overallScore: number;
  overallFeedback: string;
  verdict: "excellent" | "good" | "average" | "needs_improvement";
  strengths: string[];
  weaknesses: string[];
  topicMastery: Record<string, number>;
}

type Phase = "topic" | "loading" | "interview" | "evaluating" | "results";

/* ─── Topic options ─── */
const TOPICS = [
  { label: "JavaScript", icon: "⚡", color: "from-yellow-500 to-amber-500" },
  { label: "React", icon: "⚛️", color: "from-cyan-500 to-blue-500" },
  { label: "TypeScript", icon: "🔷", color: "from-blue-500 to-indigo-500" },
  { label: "Python", icon: "🐍", color: "from-green-500 to-emerald-500" },
  { label: "Node.js", icon: "🟢", color: "from-emerald-500 to-green-500" },
  { label: "SQL & Databases", icon: "🗃️", color: "from-orange-500 to-red-500" },
  { label: "Data Structures", icon: "🌳", color: "from-purple-500 to-violet-500" },
  { label: "CSS", icon: "🎨", color: "from-pink-500 to-rose-500" },
  { label: "System Design", icon: "🏗️", color: "from-indigo-500 to-purple-500" },
  { label: "Git & DevOps", icon: "🔧", color: "from-gray-400 to-zinc-500" },
  { label: "Java", icon: "☕", color: "from-red-500 to-orange-500" },
  { label: "HTML", icon: "📄", color: "from-orange-400 to-amber-500" },
];

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (current !== start) {
        start = current;
        setCount(current);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return <>{count}</>;
}

/* ─── Circular Progress ─── */
function CircularProgress({ score, size = 200, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", glow: "rgba(34, 197, 94, 0.4)" };
    if (s >= 60) return { stroke: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" };
    if (s >= 40) return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" };
    return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" };
  };

  const colors = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-white tabular-nums">
          <AnimatedCounter target={score} duration={2000} />
        </span>
        <span className="text-sm text-zinc-400 mt-1">out of 100</span>
      </div>
    </div>
  );
}

/* ─── Confetti Particles ─── */
function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    size: 4 + Math.random() * 8,
    color: ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"][Math.floor(Math.random() * 6)],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: "100vh",
            opacity: [1, 1, 0],
            rotate: p.rotation + 720,
            x: [0, (Math.random() - 0.5) * 200],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Score Bar for individual questions ─── */
function ScoreBar({ score, delay = 0 }: { score: number; delay?: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-emerald-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${getColor(score)}`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Quick Interview Component
   ═══════════════════════════════════════════ */
export default function QuickInterviewPage() {
  const [phase, setPhase] = useState<Phase>("topic");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
  useEffect(() => {
    if (phase !== "interview") return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  // Auto-focus input
  useEffect(() => {
    if (phase === "interview") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [phase, currentQ]);

  /* ─── Generate questions ─── */
  const startInterview = useCallback(async (selectedTopic: string) => {
    setTopic(selectedTopic);
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch("/api/quick-interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic }),
      });

      if (!res.ok) throw new Error("Failed to generate questions");

      const data = await res.json();
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(""));
      setCurrentQ(0);
      setStartTime(Date.now());
      setPhase("interview");
    } catch {
      setError("Failed to generate questions. Check your Gemini API key and try again.");
      setPhase("topic");
    }
  }, []);

  /* ─── Evaluate all answers ─── */
  const evaluateAnswers = useCallback(async (finalAnswers: string[]) => {
    setPhase("evaluating");

    try {
      const payload = {
        topic,
        answers: questions.map((q, i) => ({
          questionId: q.id,
          question: q.question,
          expectedAnswer: q.expectedAnswer,
          userAnswer: finalAnswers[i] || "[SKIPPED]",
          difficulty: q.difficulty,
          subtopic: q.subtopic,
        })),
      };

      const res = await fetch("/api/quick-interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Evaluation failed");

      const data = await res.json();
      setEvaluation(data.evaluation);
      setPhase("results");

      // Show confetti for good scores
      if (data.evaluation.overallScore >= 60) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch {
      setError("Failed to evaluate answers. Please try again.");
      setPhase("interview");
    }
  }, [topic, questions]);

  /* ─── Submit answer & move to next ─── */
  const submitAnswer = useCallback(() => {
    const trimmed = currentAnswer.trim();
    if (!trimmed) return;

    const newAnswers = [...answers];
    newAnswers[currentQ] = trimmed;
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      // All done — evaluate
      evaluateAnswers(newAnswers);
    }
  }, [currentAnswer, currentQ, answers, questions, evaluateAnswers]);

  /* ─── Skip question ─── */
  const skipQuestion = useCallback(() => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = "[SKIPPED]";
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      evaluateAnswers(newAnswers);
    }
  }, [currentQ, answers, questions, evaluateAnswers]);

  /* ─── Restart ─── */
  const restart = () => {
    setPhase("topic");
    setTopic("");
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setCurrentAnswer("");
    setEvaluation(null);
    setError(null);
    setShowConfetti(false);
    setElapsedTime(0);
  };

  const retryWithSameTopic = () => {
    const t = topic;
    restart();
    startInterview(t);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getDifficultyColor = (d: string) => {
    if (d === "easy") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (d === "medium") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const getVerdictDisplay = (v: string) => {
    switch (v) {
      case "excellent": return { label: "Excellent! 🎉", color: "text-emerald-400", bg: "bg-emerald-500/10" };
      case "good": return { label: "Good Job! 👍", color: "text-blue-400", bg: "bg-blue-500/10" };
      case "average": return { label: "Not Bad 🤔", color: "text-amber-400", bg: "bg-amber-500/10" };
      default: return { label: "Keep Practicing 💪", color: "text-red-400", bg: "bg-red-500/10" };
    }
  };

  return (
    <div className="min-h-[calc(100dvh-120px)] flex flex-col">
      {showConfetti && <Confetti />}
      
      <AnimatePresence mode="wait">
        {/* ═══════════ PHASE: TOPIC SELECTION ═══════════ */}
        {phase === "topic" && (
          <motion.div
            key="topic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Powered by Gemini AI
              </div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">Quick Interview</h1>
              <p className="mt-2 text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
                Pick a topic and answer 10 fundamental questions. Gemini AI will evaluate your answers and score you in real-time.
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 max-w-md"
              >
                {error}
              </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl w-full">
              {TOPICS.map((t, i) => (
                <motion.button
                  key={t.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => startInterview(t.label)}
                  className="group relative flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.05] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300`} />
                  <span className="text-2xl relative z-10">{t.icon}</span>
                  <span className="text-sm font-medium text-zinc-200 relative z-10">{t.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Custom topic */}
            <div className="mt-8 flex items-center gap-3 w-full max-w-md">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTopic.trim()) startInterview(customTopic.trim());
                }}
                placeholder="Or type a custom topic..."
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                onClick={() => customTopic.trim() && startInterview(customTopic.trim())}
                disabled={!customTopic.trim()}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                Go
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════ PHASE: LOADING ═══════════ */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-zinc-300 text-sm"
            >
              Gemini is crafting your questions on <span className="text-indigo-400 font-medium">{topic}</span>...
            </motion.p>
            <div className="flex gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-400"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════ PHASE: INTERVIEW Q&A ═══════════ */}
        {phase === "interview" && questions.length > 0 && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col items-center w-full max-w-2xl mx-auto"
          >
            {/* Header bar */}
            <div className="w-full flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">Topic:</span>
                <span className="text-sm font-medium text-indigo-400">{topic}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400 tabular-nums">{formatTime(elapsedTime)}</span>
                <span className="text-xs text-zinc-500">
                  {currentQ + 1}/{questions.length}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] mb-8 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 40, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8"
              >
                {/* Question header */}
                {questions[currentQ] && (
                <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-bold">
                      {currentQ + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-medium ${getDifficultyColor(questions[currentQ]!.difficulty)}`}>
                      {questions[currentQ]!.difficulty}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {questions[currentQ]!.subtopic}
                  </span>
                </div>

                {/* Question text */}
                <h2 className="text-lg md:text-xl font-semibold text-zinc-100 leading-relaxed mb-6">
                  {questions[currentQ]!.question}
                </h2>
                </>
                )}

                {/* Answer input */}
                <textarea
                  ref={inputRef}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                  placeholder="Type your answer here..."
                  className="w-full h-28 resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                />

                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={skipQuestion}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition px-3 py-2"
                  >
                    Skip →
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500">
                      Enter to submit · Shift+Enter for new line
                    </span>
                    <button
                      onClick={submitAnswer}
                      disabled={!currentAnswer.trim()}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {currentQ < questions.length - 1 ? "Next" : "Finish"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Question dots */}
            <div className="flex gap-2 mt-6">
              {questions.map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === currentQ
                      ? "bg-indigo-500 scale-125"
                      : i < currentQ
                      ? answers[i] === "[SKIPPED]"
                        ? "bg-zinc-600"
                        : "bg-emerald-500"
                      : "bg-white/[0.1]"
                  }`}
                  animate={i === currentQ ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 1.5, repeat: i === currentQ ? Infinity : 0 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════ PHASE: EVALUATING ═══════════ */}
        {phase === "evaluating" && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            {/* AI Brain animation */}
            <motion.div
              className="relative w-24 h-24 mb-6"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🧠</span>
              </div>
            </motion.div>

            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Gemini is evaluating your answers...</h3>
            <p className="text-sm text-zinc-400">Analyzing correctness, completeness, and clarity</p>

            {/* Animated progress dots */}
            <div className="flex gap-2 mt-6">
              {["Correctness", "Completeness", "Clarity"].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-indigo-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <span className="text-xs text-zinc-400">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════ PHASE: RESULTS ═══════════ */}
        {phase === "results" && evaluation && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl mx-auto"
          >
            {/* Big score display */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="flex flex-col items-center mb-10"
            >
              <CircularProgress score={evaluation.overallScore} />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-4 text-center"
              >
                {(() => {
                  const v = getVerdictDisplay(evaluation.verdict);
                  return (
                    <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${v.color} ${v.bg}`}>
                      {v.label}
                    </span>
                  );
                })()}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="mt-3 text-sm text-zinc-400 text-center max-w-md"
              >
                {evaluation.overallFeedback}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex items-center gap-4 mt-4 text-xs text-zinc-500"
              >
                <span>Topic: <span className="text-indigo-400">{topic}</span></span>
                <span>·</span>
                <span>Time: {formatTime(elapsedTime)}</span>
                <span>·</span>
                <span>{questions.length} questions</span>
              </motion.div>
            </motion.div>

            {/* Strengths & Weaknesses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="grid md:grid-cols-2 gap-4 mb-8"
            >
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
                <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <span>✦</span> Strengths
                </h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2 + i * 0.1 }}
                      className="text-xs text-zinc-300 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 mt-0.5">●</span>
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <span>△</span> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((w, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2 + i * 0.1 }}
                      className="text-xs text-zinc-300 flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">●</span>
                      {w}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Topic Mastery */}
            {evaluation.topicMastery && Object.keys(evaluation.topicMastery).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-8"
              >
                <h3 className="text-sm font-semibold text-zinc-200 mb-4">Topic Mastery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(evaluation.topicMastery).map(([subtopic, score], i) => (
                    <motion.div
                      key={subtopic}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.4 + i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-zinc-400 truncate">{subtopic}</span>
                        <span className="text-xs font-medium text-zinc-200 tabular-nums">{score}%</span>
                      </div>
                      <ScoreBar score={score} delay={2.4 + i * 0.1} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Per-question breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-8"
            >
              <h3 className="text-sm font-semibold text-zinc-200 mb-4">Question Breakdown</h3>
              <div className="space-y-3">
                {evaluation.questionResults.map((qr, i) => {
                  const q = questions.find((qq) => qq.id === qr.questionId) ?? questions[i];
                  return (
                    <motion.div
                      key={qr.questionId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.7 + i * 0.08 }}
                      className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                              qr.isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {qr.isCorrect ? "✓" : "✗"}
                            </span>
                            <span className="text-xs text-zinc-200 font-medium truncate">
                              Q{i + 1}. {q?.question}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 ml-8">{qr.feedback}</p>
                          {answers[i] && answers[i] !== "[SKIPPED]" && (
                            <p className="text-[11px] text-zinc-600 mt-1 ml-8 italic">
                              Your answer: &ldquo;{answers[i].slice(0, 120)}{answers[i].length > 120 ? "..." : ""}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-lg font-bold tabular-nums ${
                            qr.score >= 80 ? "text-emerald-400" : qr.score >= 60 ? "text-blue-400" : qr.score >= 40 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {qr.score}
                          </span>
                          <div className="flex gap-2 text-[9px] text-zinc-500">
                            <span>C:{qr.correctness}</span>
                            <span>K:{qr.completeness}</span>
                            <span>L:{qr.clarity}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              className="flex items-center justify-center gap-3 pb-8"
            >
              <button
                onClick={retryWithSameTopic}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
              >
                🔄 Retry {topic}
              </button>
              <button
                onClick={restart}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
              >
                Pick New Topic
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
