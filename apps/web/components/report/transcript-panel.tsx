"use client";

import type { TranscriptEntry } from "@recruitai/shared";
import { motion } from "framer-motion";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Full Transcript</h3>
          <p className="text-[11px] text-zinc-500">{entries.length} messages</p>
        </div>
      </div>

      <div className="max-h-[400px] space-y-2 overflow-y-auto scroll-fade pr-2">
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.timestamp}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.5) }}
            className={`flex gap-3 rounded-xl px-3 py-2.5 ${
              entry.speaker === "AI"
                ? "bg-indigo-500/[0.06]"
                : "bg-emerald-500/[0.04]"
            }`}
          >
            <div
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                entry.speaker === "AI"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {entry.speaker === "AI" ? "AI" : "C"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${entry.speaker === "AI" ? "text-indigo-400" : "text-emerald-400"}`}>
                  {entry.speaker === "AI" ? "Interviewer" : "Candidate"}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">{entry.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
