"use client";

import { motion } from "framer-motion";

interface ScoreOverviewProps {
  overallScore: number;
  verdict: string;
}

export function ScoreOverview({ overallScore, verdict }: ScoreOverviewProps) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = (overallScore / 100) * circumference;
  const color =
    overallScore >= 80 ? "text-emerald-400" : overallScore >= 60 ? "text-amber-400" : "text-red-400";
  const strokeColor =
    overallScore >= 80 ? "#34d399" : overallScore >= 60 ? "#fbbf24" : "#f87171";
  const verdictColor =
    verdict.toLowerCase().includes("hire")
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
      : verdict.toLowerCase().includes("reject")
        ? "bg-red-500/15 text-red-300 border-red-400/20"
        : "bg-amber-500/15 text-amber-300 border-amber-400/20";

  return (
    <div className="glass-elevated flex items-center gap-6 rounded-2xl p-6">
      {/* Radial score */}
      <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className={`text-3xl font-bold ${color}`}
          >
            {overallScore}
          </motion.p>
          <p className="text-[10px] text-zinc-500">out of 100</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Overall Score</p>
        <h3 className="mt-1 text-xl font-semibold text-zinc-100">Candidate Assessment</h3>
        <div className="mt-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${verdictColor}`}>
            {verdict}
          </span>
        </div>
      </div>
    </div>
  );
}
