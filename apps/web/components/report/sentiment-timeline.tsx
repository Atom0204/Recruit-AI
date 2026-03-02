"use client";

import { motion } from "framer-motion";

interface SentimentPoint {
  question: number;
  confidence: number;
  sentiment: string;
}

interface SentimentTimelineProps {
  points: SentimentPoint[];
}

const sentimentColors: Record<string, { bg: string; text: string; dot: string }> = {
  positive: { bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
  neutral: { bg: "bg-zinc-500/15", text: "text-zinc-300", dot: "bg-zinc-400" },
  anxious: { bg: "bg-amber-500/15", text: "text-amber-300", dot: "bg-amber-400" },
  negative: { bg: "bg-red-500/15", text: "text-red-300", dot: "bg-red-400" },
  confident: { bg: "bg-indigo-500/15", text: "text-indigo-300", dot: "bg-indigo-400" }
};

const fallbackColors = { bg: "bg-zinc-500/15", text: "text-zinc-300", dot: "bg-zinc-400" };

function getColors(sentiment: string) {
  return sentimentColors[sentiment.toLowerCase()] ?? fallbackColors;
}

export function SentimentTimeline({ points }: SentimentTimelineProps) {
  const maxConfidence = Math.max(...points.map((p) => p.confidence), 100);

  return (
    <div className="glass-elevated rounded-2xl p-6">
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">Emotional Arc</h3>
      <p className="mb-4 text-[11px] text-zinc-500">Confidence & sentiment per question</p>

      {/* Bar chart */}
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {points.map((point, i) => {
          const height = (point.confidence / maxConfidence) * 100;
          const colors = getColors(point.sentiment);
          return (
            <div key={point.question} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.1 * i, duration: 0.5, ease: "easeOut" }}
                className={`w-full rounded-t-lg ${colors.bg} relative min-h-[4px]`}
                style={{ maxHeight: "100%" }}
              >
                <div className={`absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ${colors.dot}`} />
              </motion.div>
              <span className="text-[10px] text-zinc-500">Q{point.question}</span>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {points.map((point) => {
          const colors = getColors(point.sentiment);
          return (
            <span
              key={point.question}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${colors.bg} ${colors.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              Q{point.question}: {point.sentiment} ({point.confidence}%)
            </span>
          );
        })}
      </div>
    </div>
  );
}
