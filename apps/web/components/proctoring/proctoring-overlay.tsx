"use client";

import type { ProctoringEvent } from "@recruitai/shared";
import { useMemo } from "react";
import { Card } from "../ui/card";

interface ProctoringOverlayProps {
  proctoringLog: ProctoringEvent[];
  tabViolations: number;
  interviewLocked: boolean;
}

export function ProctoringOverlay({ proctoringLog, tabViolations, interviewLocked }: ProctoringOverlayProps) {
  const flags = useMemo(
    () => [
      { label: "Gaze", status: "stable" },
      { label: "Tab", status: tabViolations > 0 ? `violations ${tabViolations}` : "active" },
      { label: "Audio", status: "monitored" },
      { label: "Session", status: interviewLocked ? "locked" : "clear" }
    ],
    [interviewLocked, tabViolations]
  );

  const latestEvents = proctoringLog.slice(-3).reverse();

  return (
    <Card className="absolute bottom-4 right-4 w-[300px] p-3">
      <p className="text-xs font-semibold text-zinc-200">Proctoring</p>
      <div className="mt-2 space-y-1 text-xs">
        {flags.map((flag) => (
          <p key={flag.label}>
            <span className="text-zinc-400">{flag.label}:</span>{" "}
            <span className={flag.status.includes("violation") || flag.status === "locked" ? "text-rose-300" : "text-emerald-400"}>
              {flag.status}
            </span>
          </p>
        ))}

        {latestEvents.length > 0 ? (
          <div className="mt-2 rounded-xl border border-rose-300/20 bg-rose-500/10 p-2">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-rose-200">Recent alerts</p>
            {latestEvents.map((event, index) => (
              <p key={`${event.timestamp}-${event.type}-${index}`} className="text-[11px] text-zinc-300">
                {event.type} · {event.severity}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
