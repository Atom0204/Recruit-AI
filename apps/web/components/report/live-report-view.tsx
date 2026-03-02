"use client";

import type { CandidateFitReport } from "@recruitai/shared";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { ScoreOverview } from "./score-overview";
import { SentimentTimeline } from "./sentiment-timeline";
import { TranscriptPanel } from "./transcript-panel";

interface LiveReportViewProps {
  interviewId: string;
  fallbackReport: CandidateFitReport;
}

type ReportResponse =
  | { status: "processing"; reportReadyAt: string }
  | { status: "ready"; report: CandidateFitReport; reportReadyAt: string };

export function LiveReportView({ interviewId, fallbackReport }: LiveReportViewProps) {
  const [reportData, setReportData] = useState<CandidateFitReport | null>(null);
  const [reportReadyAt, setReportReadyAt] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await fetch(`/api/report/${interviewId}`, { cache: "no-store" });
      if (!response.ok) {
        if (!cancelled) {
          setIsProcessing(false);
          setReportData(fallbackReport);
        }
        return;
      }

      const payload = (await response.json()) as ReportResponse;
      if (cancelled) {
        return;
      }

      if (payload.status === "ready") {
        setReportData(payload.report);
        setReportReadyAt(payload.reportReadyAt);
        setIsProcessing(false);
        return;
      }

      setReportReadyAt(payload.reportReadyAt);
      setIsProcessing(true);
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [fallbackReport, interviewId]);

  const etaLabel = useMemo(() => {
    if (!reportReadyAt) {
      return "Analyzing interview...";
    }

    const diffMs = new Date(reportReadyAt).getTime() - Date.now();
    if (diffMs <= 0) {
      return "Finalizing report...";
    }

    const seconds = Math.ceil(diffMs / 1000);
    return `Estimated ready in ~${seconds}s`;
  }, [reportReadyAt]);

  const report = reportData ?? fallbackReport;

  if (isProcessing && !reportData) {
    return (
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Card className="text-center">
          <p className="text-xs uppercase tracking-widest text-indigo-300">AI Analysis In Progress</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-100">Generating final interview report</h2>
          <p className="mt-2 text-sm text-zinc-300">{etaLabel}</p>
          <div className="mx-auto mt-4 h-2 w-full max-w-lg rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
              initial={{ width: "12%" }}
              animate={{ width: ["22%", "58%", "82%", "95%"] }}
              transition={{ duration: 3.4, repeat: Infinity }}
            />
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              Open Dashboard
            </Link>
          </div>
        </Card>
      </motion.section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">Interview ID: {interviewId}</p>
        <Link href="/dashboard" className="text-xs text-indigo-300 hover:text-indigo-200">
          View All Reports
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <ScoreOverview overallScore={report.overallScore} verdict={report.verdict} />
        <SentimentTimeline points={report.sentimentAnalysis.emotionalArc} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h3 className="mb-3 text-base font-semibold">Category Scores</h3>
          <div className="space-y-3">
            {report.categoryScores.map((item) => (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                  <span>{item.category}</span>
                  <span>{item.score}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.score}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-400">{item.feedback}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-semibold">AI Insights</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400">Strengths</p>
              <p className="text-zinc-200">{report.areasOfStrength.join(" • ") || "No major strengths detected."}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400">Improvements</p>
              <p className="text-zinc-200">{report.areasForImprovement.join(" • ") || "No major risks detected."}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400">Integrity Flags</p>
              <p className="text-zinc-200">{report.sentimentAnalysis.flags.join(" • ") || "No integrity concerns detected."}</p>
            </div>
          </div>
        </Card>
      </div>

      <TranscriptPanel entries={report.transcript} />
    </section>
  );
}
