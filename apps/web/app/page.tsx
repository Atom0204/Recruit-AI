"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";

const features = [
  {
    icon: "⚡",
    title: "Quick Interview",
    desc: "Pick a topic, answer 10 fundamental questions, and get instant AI-powered scoring with beautiful animations."
  },
  {
    icon: "🎙️",
    title: "Voice-First Interview",
    desc: "Two-way voice conversation powered by AI. Natural, adaptive questioning just like a real recruiter."
  },
  {
    icon: "📄",
    title: "Resume Intelligence",
    desc: "Upload a resume — AI parses skills, generates a role profile, and tailors every question to the candidate."
  },
  {
    icon: "🛡️",
    title: "Anti-Cheat Proctoring",
    desc: "Real-time tab monitoring, focus detection, and clipboard surveillance ensure interview integrity."
  },
  {
    icon: "📊",
    title: "AI-Powered Reports",
    desc: "Comprehensive scoring across technical depth, communication, integrity, and sentiment analysis."
  }
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-[500px] h-[500px] bg-indigo-500/30 -top-40 -left-40" />
      <div className="orb w-[400px] h-[400px] bg-emerald-500/20 -bottom-32 -right-32" style={{ animationDelay: "3s" }} />
      <div className="orb w-[300px] h-[300px] bg-purple-500/15 top-1/2 left-1/2" style={{ animationDelay: "5s" }} />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-400">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <span className="text-base font-semibold text-zinc-100">RecruitAI</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          <Link href="/quick-interview" className="transition hover:text-zinc-100">Quick Interview</Link>
          <Link href="/coding-interview" className="transition hover:text-zinc-100">Coding Interview</Link>
          <Link href="/upload" className="transition hover:text-zinc-100">Full Interview</Link>
          <Link href="/dashboard" className="transition hover:text-zinc-100">Dashboard</Link>
        </nav>
        <Link href="/quick-interview">
          <Button size="sm">Get Started</Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-16 text-center md:pt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <span className="status-dot status-dot-live" />
            AI-Powered Interview Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl"
        >
          Interviews that{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
            think, listen
          </span>
          <br />
          and evaluate
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 max-w-2xl text-base text-zinc-400 md:text-lg"
        >
          Upload a resume, and our AI conducts a real-time voice interview — asking adaptive questions,
          monitoring integrity, and delivering a detailed candidate-fit report.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/quick-interview">
            <Button size="lg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Interview
            </Button>
          </Link>
          <Link href="/coding-interview">
            <Button variant="secondary" size="lg">Coding Interview</Button>
          </Link>
          <Link href="/upload">
            <Button variant="secondary" size="lg">Full Interview</Button>
          </Link>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-20 grid gap-4 text-left md:grid-cols-2 lg:grid-cols-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-zinc-100">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Interview preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-16 w-full max-w-3xl"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5">
            {/* Fake title bar */}
            <div className="flex items-center gap-2 rounded-t-xl bg-white/[0.03] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-zinc-500">RecruitAI Interview Session</span>
            </div>
            {/* Mock interview content */}
            <div className="flex gap-3 p-4">
              <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.05] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/30" />
                  <div>
                    <p className="text-xs font-medium text-zinc-200">AI Interviewer</p>
                    <p className="text-[10px] text-zinc-500">Speaking...</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">
                  &ldquo;Tell me about a time you led a technical migration. What challenges did you face and how did you measure success?&rdquo;
                </p>
              </div>
              <div className="flex-1 rounded-xl bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/30" />
                  <div>
                    <p className="text-xs font-medium text-zinc-200">Candidate</p>
                    <p className="text-[10px] text-zinc-500">Listening</p>
                  </div>
                </div>
                <div className="flex gap-1.5 py-2">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
