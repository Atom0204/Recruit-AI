export const DESIGN_TOKENS = {
  background: "from-zinc-950 to-zinc-900",
  glass: "bg-white/5 backdrop-blur-xl border border-white/10",
  primary: "from-indigo-500 to-indigo-400",
  success: "emerald-500",
  warning: "amber-500",
  error: "rose-500"
} as const;

export const INTERVIEW_DEFAULTS = {
  baseQuestionCount: 5,
  maxQuestionCount: 8,
  questionTimeLimitSeconds: 300,
  overallTimeLimitSeconds: 2700
} as const;
