import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.22em] text-indigo-300">RecruitAI</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-100 md:text-6xl">
          Intelligent Resume-to-Interview System
        </h1>
        <p className="mt-4 text-zinc-300">
          Upload a resume, generate a shadow role, run an adaptive interview, and receive a candidate-fit report with proctoring insights.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Phase 1-2</p>
          <h2 className="mt-2 text-lg font-semibold">Parse + Shadow JD</h2>
          <p className="mt-2 text-sm text-zinc-300">Structured resume extraction with generated role rubric.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Phase 3-4</p>
          <h2 className="mt-2 text-lg font-semibold">Agentic Interview</h2>
          <p className="mt-2 text-sm text-zinc-300">Adaptive branching with live transcript and coding panel.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Phase 5</p>
          <h2 className="mt-2 text-lg font-semibold">Candidate Fit Report</h2>
          <p className="mt-2 text-sm text-zinc-300">Weighted scoring, sentiment arc, and export-ready output.</p>
        </Card>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/upload">
          <Button>Start Upload</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="secondary">Open Dashboard</Button>
        </Link>
        <Link href="/report/demo">
          <Button variant="ghost">View Demo Report</Button>
        </Link>
      </div>
    </main>
  );
}
