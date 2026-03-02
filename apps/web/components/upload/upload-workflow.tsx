"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ParsedResume, ShadowJobDescription } from "@recruitai/shared";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Pill } from "../ui/pill";

type Step = "idle" | "parsing" | "parsed" | "jd";

export function UploadWorkflow() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [shadowJd, setShadowJd] = useState<ShadowJobDescription | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => {
    if (step === "idle") return 0;
    if (step === "parsing") return 35;
    if (step === "parsed") return 70;
    return 100;
  }, [step]);

  const parseResume = async () => {
    if (!file) return;
    setError(null);
    setStep("parsing");

    const formData = new FormData();
    formData.set("resume", file);

    const parseResponse = await fetch("/api/parse-resume", { method: "POST", body: formData });
    if (!parseResponse.ok) {
      setError("Failed to parse resume.");
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
      setError("Failed to generate shadow JD.");
      return;
    }

    const jdPayload: { shadowJd: ShadowJobDescription } = await jdResponse.json();
    setShadowJd(jdPayload.shadowJd);
    setStep("jd");
  };

  const startInterview = async () => {
    if (!resume || !shadowJd) {
      return;
    }

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

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Resume Upload</h2>
          <p className="mt-1 text-sm text-zinc-300">Upload PDF up to 10MB. Parsing uses strict structured schema.</p>
        </div>

        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-zinc-900/40 text-sm text-zinc-300">
          <input
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
            }}
          />
          <p>{file ? file.name : "Drop resume here or click to browse"}</p>
          <p className="mt-1 text-xs text-zinc-400">Supported: PDF or TXT</p>
        </label>

        <div className="space-y-2">
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400">Progress: {progress}%</p>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={!file || step === "parsing"} onClick={parseResume}>
            {step === "parsing" ? "Parsing..." : "Parse Resume"}
          </Button>
          {shadowJd ? (
            <Button variant="secondary" onClick={startInterview} disabled={isStartingInterview}>
              {isStartingInterview ? "Starting..." : "Start Interview"}
            </Button>
          ) : null}
          {interviewId ? (
            <Link
              className="inline-block rounded-xl border border-indigo-300/40 px-3 py-2 text-xs text-indigo-200 hover:bg-indigo-500/15"
              href={`/interview/${interviewId}`}
            >
              Rejoin Session
            </Link>
          ) : null}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Pre-Interview Lobby</h3>
        {!resume ? <p className="mt-2 text-sm text-zinc-400">Parsed summary appears here.</p> : null}

        {resume ? (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Candidate</p>
              <p className="text-sm text-zinc-100">{resume.candidate.name}</p>
              <p className="text-xs text-zinc-400">{resume.candidate.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Primary Skills</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {resume.skills.primary.map((skill) => (
                  <Pill key={skill} label={skill} />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {shadowJd ? (
          <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-zinc-900/40 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Generated Role</p>
            <p className="text-sm font-semibold text-indigo-200">{shadowJd.title}</p>
            <p className="text-xs text-zinc-400">Focus: {shadowJd.interviewFocus.join(" • ")}</p>
            <p className="text-xs text-zinc-400">Start the live interview from the left panel.</p>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
