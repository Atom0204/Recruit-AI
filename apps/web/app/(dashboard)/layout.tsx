import type { PropsWithChildren } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="text-sm font-semibold tracking-wide text-indigo-300">
          RecruitAI Console
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-300">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/upload">Upload</Link>
          <Link href="/interview/demo">Interview</Link>
          <Link href="/report/demo">Report</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
