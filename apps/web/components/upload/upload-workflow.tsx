"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ParsedResume, ShadowJobDescription } from "@recruitai/shared";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Pill } from "../ui/pill";

type Step = "idle" | "parsing" | "parsed" | "jd";

const steps = [
  { key: "upload", label: "Upload" },
  { key: "parse", label: "Parse Resume" },
  { key: "generate", label: "Generate Role" },
  { key: "interview", label: "Start" }
] as const;

function stepIndex(step: Step): number {
  if (step === "idle") return 0;
  if (step === "parsing") return 1;
  if (step === "parsed") return 2;
  return 3;
}

export function UploadWorkflow() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [shadowJd, setShadowJd] = useState<ShadowJobDescription | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const activeStep = stepIndex(step);

  const parseResume = async () => {
    if (!file) return;
    setError(null);
    setStep("parsing");

    const formData = new FormData();
    formData.set("resume", file);

    const parseResponse = await fetch("/api/parse-resume", { method: "POST", body: formData });
    if (!parseResponse.ok) {
      setError("Failed to parse resume. Please try a different file.");
      setStep("idle");
      return;
    }

    const parsePayload: { parsedResume: ParsedResume } = await parseResponse.json();
    setResume(parsePayload.parsedResume);
    setStep("parsed");

    const jdResponse = await fetch("/api/generate-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: parsePayload.parsedResume })
    });

    if (!jdResponse.ok) {
      setError("Failed to generate role profile.");
      return;
    }

    const jdPayload: { shadowJd: ShadowJobDescription } = await jdResponse.json();
    setShadowJd(jdPayload.shadowJd);
    setStep("jd");
  };

  const startInterview = async () => {
    if (!resume || !shadowJd) return;
    setIsStartingInterview(true);
    setError(null);

    const response = await fetch("/api/start-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, shadowJd })
    });

    if (!response.ok) {
      setError("Unable to start interview session.");
      setIsStartingInterview(false);
      return;
    }

    const payload: { interview: { id: string } } = await response.json();
    setInterviewId(payload.interview.id);
    router.push(`/interview/${payload.interview.id}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  i <= activeStep
                    ? "bg-indigo-500 text-white shadow-glow-sm"
                    : "bg-white/[0.06] text-zinc-500"
                }`}
              >
                {i < activeStep ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`hidden text-xs md:block ${i <= activeStep ? "text-zinc-200" : "text-zinc-500"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-px w-8 md:w-12 ${i < activeStep ? "bg-indigo-500/50" : "bg-white/[0.06]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left — Upload area */}
        <div className="space-y-4">
          <Card elevated>
            <h2 className="text-lg font-semibold text-zinc-100">Upload Resume</h2>
            <p className="mt-1 text-xs text-zinc-400">AI will parse the document and extract structured data</p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
                isDragOver
                  ? "border-indigo-400/60 bg-indigo-500/[0.08]"
                  : file
                    ? "border-emerald-400/40 bg-emerald-500/[0.05]"
                    : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                }}
              />

              {file ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-200">{file.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05]">
                    <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-300">Drop your resume here or click to browse</p>
                  <p className="mt-1 text-xs text-zinc-500">PDF or TXT · Max 10 MB</p>
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5"
                >
                  <p className="text-xs text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                disabled={!file || step === "parsing"}
                onClick={parseResume}
              >
                {step === "parsing" ? (
                  <>
                    <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Analyzing...
                  </>
                ) : (
                  "Parse & Analyze"
                )}
              </Button>

              {shadowJd && (
                <Button variant="secondary" onClick={startInterview} disabled={isStartingInterview}>
                  {isStartingInterview ? (
                    <>
                      <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      🎙️ Start Voice Interview
                    </>
                  )}
                </Button>
              )}

              {interviewId && (
                <Link
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300 transition hover:bg-indigo-500/20"
                  href={`/interview/${interviewId}`}
                >
                  Rejoin Session →
                </Link>
              )}
            </div>
          </Card>
        </div>

        {/* Right — Preview */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!resume ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                    <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-400">Resume preview appears here</p>
                  <p className="mt-1 text-xs text-zinc-500">Upload and parse to see extracted data</p>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card elevated>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-indigo-400">Parsed Profile</p>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-100">{resume.candidate.name}</h3>
                      <p className="text-xs text-zinc-400">{resume.candidate.email}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                      <span className="text-base font-bold text-indigo-300">{Math.round(resume.confidence * 100)}%</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-zinc-300">{resume.summary}</p>

                  <div className="mt-4">
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.skills.primary.map((skill) => (
                        <Pill key={skill} label={skill} />
                      ))}
                      {resume.skills.secondary.map((skill) => (
                        <Pill key={skill} label={skill} variant="success" />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Seniority</p>
                    <p className="mt-0.5 text-xs font-medium capitalize text-zinc-200">{resume.seniorityLevel}</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {shadowJd && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glow-accent">
                  <p className="text-[10px] uppercase tracking-wider text-indigo-400">AI-Generated Role</p>
                  <h4 className="mt-1 text-base font-semibold text-zinc-100">{shadowJd.title}</h4>
                  <p className="mt-0.5 text-xs text-zinc-400">{shadowJd.company} · {shadowJd.department}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {shadowJd.interviewFocus.map((focus) => (
                      <Pill key={focus} label={focus} variant="warning" />
                    ))}
                  </div>

                  <div className="mt-3 rounded-lg bg-white/[0.03] p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Required Skills</p>
                    <p className="mt-1 text-xs text-zinc-300">{shadowJd.requiredSkills.join(" · ")}</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
