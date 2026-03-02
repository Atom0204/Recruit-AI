"use client";

import type { CandidateFitReport } from "@recruitai/shared";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
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

function ProcessingState({ etaLabel }: { etaLabel: string }) {
  const steps = ["Analyzing transcript", "Scoring responses", "Evaluating integrity", "Generating insights"];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-16">
      {/* Spinner */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-20 w-20 rounded-full border-2 border-white/[0.06] border-t-indigo-400"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-indigo-400">AI</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-zinc-100">Analyzing Your Interview</h2>
      <p className="mt-2 text-sm text-zinc-400">{etaLabel}</p>

      {/* Step indicators */}
      <div className="mt-8 space-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
              i < activeStep
                ? "bg-emerald-500/20"
                : i === activeStep
                  ? "bg-indigo-500/20"
                  : "bg-white/[0.04]"
            }`}>
              {i < activeStep ? (
                <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : i === activeStep ? (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-indigo-400"
                />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              )}
            </div>
            <span className={`text-xs ${
              i <= activeStep ? "text-zinc-200" : "text-zinc-500"
            }`}>
              {step}
            </span>
          </motion.div>
        ))}
      </div>

      <Link href="/dashboard" className="mt-8">
        <Button variant="secondary" size="sm">Back to Dashboard</Button>
      </Link>
    </motion.div>
  );
}

export function LiveReportView({ interviewId, fallbackReport }: LiveReportViewProps) {
  const [reportData, setReportData] = useState<CandidateFitReport | null>(null);
  const [reportReadyAt, setReportReadyAt] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await fetch(`/api/report/${interviewId}`, { cache: "no-store" });
      if (!response.ok) {
        if (!cancelled) { setIsProcessing(false); setReportData(fallbackReport); }
        return;
      }

      const payload = (await response.json()) as ReportResponse;
      if (cancelled) return;

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
    const intervalId = window.setInterval(() => { void load(); }, 5000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, [fallbackReport, interviewId]);

  const etaLabel = useMemo(() => {
    if (!reportReadyAt) return "Analyzing interview...";
    const diffMs = new Date(reportReadyAt).getTime() - Date.now();
    if (diffMs <= 0) return "Finalizing report...";
    const seconds = Math.ceil(diffMs / 1000);
    return `Estimated ready in ~${seconds}s`;
  }, [reportReadyAt]);

  const report = reportData ?? fallbackReport;

  if (isProcessing && !reportData) {
    return <ProcessingState etaLabel={etaLabel} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Interview Report</h1>
          <p className="mt-0.5 text-xs text-zinc-500">{report.candidateName} · {report.role} · {new Date(report.date).toLocaleDateString()}</p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="sm">All Reports</Button>
        </Link>
      </div>

      {/* Score + Sentiment row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ScoreOverview overallScore={report.overallScore} verdict={report.verdict} />
        <SentimentTimeline points={report.sentimentAnalysis.emotionalArc} />
      </div>

      {/* Category scores */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-100">Category Breakdown</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {report.categoryScores.map((item) => (
            <div key={item.category} className="rounded-xl bg-white/[0.02] p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-200">{item.category}</span>
                <span className={`text-xs font-bold ${
                  item.score >= 80 ? "text-emerald-400" : item.score >= 60 ? "text-amber-400" : "text-red-400"
                }`}>
                  {item.score}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    item.score >= 80 ? "bg-emerald-400" : item.score >= 60 ? "bg-amber-400" : "bg-red-400"
                  }`}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400">{item.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-emerald-400">Strengths</p>
          <ul className="space-y-1">
            {report.areasOfStrength.map((s) => (
              <li key={s} className="flex items-start gap-2 text-xs text-zinc-300">
                <span className="mt-0.5 text-emerald-400">✓</span> {s}
              </li>
            ))}
            {report.areasOfStrength.length === 0 && <li className="text-xs text-zinc-500">No major strengths detected.</li>}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-amber-400">Improvements</p>
          <ul className="space-y-1">
            {report.areasForImprovement.map((s) => (
              <li key={s} className="flex items-start gap-2 text-xs text-zinc-300">
                <span className="mt-0.5 text-amber-400">→</span> {s}
              </li>
            ))}
            {report.areasForImprovement.length === 0 && <li className="text-xs text-zinc-500">No major risks detected.</li>}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-red-400">Integrity Flags</p>
          <ul className="space-y-1">
            {report.sentimentAnalysis.flags.map((s) => (
              <li key={s} className="flex items-start gap-2 text-xs text-zinc-300">
                <span className="mt-0.5 text-red-400">⚠</span> {s}
              </li>
            ))}
            {report.sentimentAnalysis.flags.length === 0 && <li className="text-xs text-zinc-500">No integrity concerns.</li>}
          </ul>
        </div>
      </div>

      {/* Resources */}
      {report.recommendedResources.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <p className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">Recommended Resources</p>
          <div className="flex flex-wrap gap-2">
            {report.recommendedResources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-indigo-300 transition hover:bg-white/[0.05]"
              >
                📚 {r.topic}: {r.resource}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      <TranscriptPanel entries={report.transcript} />
    </motion.div>
  );
}
