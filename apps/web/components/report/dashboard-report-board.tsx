"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "../ui/card";

interface DashboardItem {
  interviewId: string;
  candidateName: string;
  role: string;
  status: "in_progress" | "processing" | "ready";
  createdAt: string;
  reportReadyAt?: string;
  overallScore?: number;
  verdict?: string;
}

export function DashboardReportBoard() {
  const [items, setItems] = useState<DashboardItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await fetch("/api/dashboard/reports", { cache: "no-store" });
      if (!response.ok || cancelled) {
        return;
      }

      const payload = (await response.json()) as { items: DashboardItem[] };
      if (!cancelled) {
        setItems(payload.items);
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">Recruiter Dashboard</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">Live interview and report pipeline</h2>
          </div>
          <Link href="/upload" className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10">
            New Interview
          </Link>
        </div>
      </Card>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-300">No interviews yet. Start from upload to create a new session.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <motion.div key={item.interviewId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{item.candidateName}</p>
                  <p className="text-xs text-zinc-400">{item.role}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">Session: {item.interviewId}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "ready"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : item.status === "processing"
                          ? "bg-indigo-500/20 text-indigo-200"
                          : "bg-amber-500/20 text-amber-100"
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.status === "ready" ? (
                    <div className="text-right text-xs text-zinc-200">
                      <p>Score {item.overallScore ?? "-"}</p>
                      <p>{item.verdict ?? ""}</p>
                    </div>
                  ) : null}

                  <Link
                    href={item.status === "in_progress" ? `/interview/${item.interviewId}` : `/report/${item.interviewId}`}
                    className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                  >
                    {item.status === "in_progress" ? "Resume" : "Open"}
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
