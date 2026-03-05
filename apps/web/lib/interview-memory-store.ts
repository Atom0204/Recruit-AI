import type {
  CandidateFitReport,
  InterviewQuestion,
  ParsedResume,
  ProctoringEvent,
  ShadowJobDescription,
  TranscriptEntry
} from "@recruitai/shared";

interface InterviewSession {
  id: string;
  userId: string;
  candidateName: string;
  role: string;
  resume: ParsedResume;
  shadowJd: ShadowJobDescription;
  questions: InterviewQuestion[];
  status: "in_progress" | "completed";
  createdAt: string;
  startedAt: string;
  endedAt?: string;
  transcript: TranscriptEntry[];
  proctoringLog: ProctoringEvent[];
  reportReadyAt?: string;
  report?: CandidateFitReport;
}

interface DashboardReportItem {
  interviewId: string;
  candidateName: string;
  role: string;
  status: "in_progress" | "processing" | "ready";
  createdAt: string;
  reportReadyAt?: string;
  overallScore?: number;
  verdict?: CandidateFitReport["verdict"];
}

const REPORT_DELAY_MS = 45_000;

const getStore = (): Map<string, InterviewSession> => {
  const key = "__recruitai_interview_store__";
  const globalScope = globalThis as typeof globalThis & {
    [storeKey: string]: Map<string, InterviewSession> | undefined;
  };

  if (!globalScope[key]) {
    globalScope[key] = new Map<string, InterviewSession>();
  }

  return globalScope[key];
};

const calculateCategoryScore = (
  rubricCategory: string,
  transcript: TranscriptEntry[],
  proctoringLog: ProctoringEvent[]
): { score: number; feedback: string } => {
  const candidateEntries = transcript.filter((entry) => entry.speaker === "Candidate");
  const allText = candidateEntries.map((entry) => entry.text).join(" ");
  const normalized = allText.toLowerCase();
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const avgPerAnswer = candidateEntries.length > 0 ? wordCount / candidateEntries.length : 0;

  // Proctoring penalties
  const highSeverityCount = proctoringLog.filter((event) => event.severity === "high").length;
  const mediumSeverityCount = proctoringLog.filter((event) => event.severity === "medium").length;
  const integrityPenalty = highSeverityCount * 8 + mediumSeverityCount * 3;

  // Base: answers exist and have substance
  let base = 40;
  if (candidateEntries.length >= 8) base += 8;
  else if (candidateEntries.length >= 5) base += 4;
  if (avgPerAnswer >= 50) base += 6;
  else if (avgPerAnswer >= 30) base += 3;

  // Technical depth signals
  const technicalSignals = [
    "architecture", "database", "cache", "queue", "throughput", "scalable",
    "incident", "debug", "profil", "optimize", "latency", "deploy", "ci/cd",
    "monitoring", "test", "rollback", "api", "endpoint", "schema", "index",
    "query", "mutex", "thread", "async", "await", "stream", "pipeline",
    "algorithm", "complexity", "o(n)", "o(log", "hash", "tree", "graph"
  ];
  const technicalHits = technicalSignals.filter((s) => normalized.includes(s)).length;

  // Structure signals
  const structureSignals = [
    "because", "therefore", "first", "second", "finally", "for example",
    "the trade-off", "my approach", "the result", "as a result", "specifically",
    "the reason", "in conclusion", "to summarize"
  ];
  const structureHits = structureSignals.filter((s) => normalized.includes(s)).length;

  // Specificity signals (numbers, metrics)
  const specificityHits = (allText.match(/\d+%|\d+ms|\d+ users|\d+x|p99|p95|sla|slo|kpi/gi) ?? []).length;

  // Collaboration / soft skill signals
  const collabSignals = [
    "team", "stakeholder", "mentor", "feedback", "alignment", "conflict",
    "collaborate", "pair", "review", "discuss", "communicate", "present"
  ];
  const collabHits = collabSignals.filter((s) => normalized.includes(s)).length;

  // Category-specific scoring
  const cat = rubricCategory.toLowerCase();
  let categoryBonus = 0;
  let feedbackContext = "";

  if (cat.includes("technical")) {
    categoryBonus = Math.min(20, technicalHits * 2.5);
    categoryBonus += Math.min(8, specificityHits * 2);
    feedbackContext = technicalHits >= 6
      ? "Strong technical vocabulary with evidence of hands-on experience."
      : technicalHits >= 3
        ? "Adequate technical awareness; deeper production examples would strengthen the case."
        : "Limited technical depth demonstrated; answers lacked specific technical details.";
  } else if (cat.includes("system") || cat.includes("design")) {
    const designSignals = ["scale", "replica", "partition", "failover", "load balanc", "shard", "eventual consistency", "cap theorem", "data model", "api gateway"];
    const designHits = designSignals.filter((s) => normalized.includes(s)).length;
    categoryBonus = Math.min(18, designHits * 3 + technicalHits * 1);
    categoryBonus += Math.min(6, specificityHits * 2);
    feedbackContext = designHits >= 4
      ? "Demonstrated solid systems thinking with awareness of distributed system trade-offs."
      : designHits >= 2
        ? "Shows architectural awareness but needs deeper treatment of failure modes and scaling."
        : "System design answers were surface-level; recommend studying distributed systems fundamentals.";
  } else if (cat.includes("problem") || cat.includes("solving")) {
    categoryBonus = Math.min(16, structureHits * 2.5);
    categoryBonus += Math.min(10, technicalHits * 1.5);
    const hasMethodology = /\b(approach|strategy|hypothesis|step|debug|profil|test|isolat|reproduc)\b/i.test(allText);
    if (hasMethodology) categoryBonus += 6;
    feedbackContext = structureHits >= 4 && hasMethodology
      ? "Structured and methodical problem-solving approach with clear reasoning."
      : structureHits >= 2
        ? "Decent problem decomposition but could improve systematic methodology."
        : "Problem-solving answers lacked clear structure; practice breaking problems into steps.";
  } else if (cat.includes("communication") || cat.includes("culture") || cat.includes("behavioral")) {
    categoryBonus = Math.min(14, collabHits * 2);
    categoryBonus += Math.min(10, structureHits * 2);
    const isVerbose = avgPerAnswer >= 40;
    if (isVerbose) categoryBonus += 5;
    feedbackContext = collabHits >= 4 && structureHits >= 3
      ? "Excellent communication — structured, empathetic, and concrete with examples."
      : collabHits >= 2
        ? "Good communication baseline; adding more structured examples (STAR format) would help."
        : "Communication could improve — answers were brief or lacked structure and examples.";
  } else {
    categoryBonus = Math.min(12, (technicalHits + structureHits + collabHits) * 1.5);
    feedbackContext = "General evaluation — see specific category notes for details.";
  }

  const score = Math.max(25, Math.min(98, base + categoryBonus - integrityPenalty));
  return { score, feedback: feedbackContext };
};

export const createInterviewSession = async (
  userId: string,
  resume: ParsedResume,
  shadowJd: ShadowJobDescription
): Promise<InterviewSession> => {
  const { buildInterviewScript } = await import("@recruitai/ai-service");
  const questions = await buildInterviewScript(resume, shadowJd);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const session: InterviewSession = {
    id,
    userId,
    candidateName: resume.candidate.name,
    role: shadowJd.title,
    resume,
    shadowJd,
    questions,
    status: "in_progress",
    createdAt: now,
    startedAt: now,
    transcript: [],
    proctoringLog: []
  };

  getStore().set(id, session);
  return session;
};

export const getInterviewSession = (id: string): InterviewSession | null => {
  return getStore().get(id) ?? null;
};

export const getInterviewSessionForUser = (id: string, userId: string): InterviewSession | null => {
  const session = getStore().get(id) ?? null;
  if (!session || session.userId !== userId) {
    return null;
  }

  return session;
};

export const completeInterviewSession = async (
  id: string,
  userId: string,
  transcript: TranscriptEntry[],
  proctoringLog: ProctoringEvent[]
): Promise<InterviewSession | null> => {
  const { generateCandidateReport } = await import("@recruitai/ai-service");
  const session = getStore().get(id);

  if (!session || session.userId !== userId) {
    return null;
  }

  const now = new Date();
  const endedAt = now.toISOString();
  const reportReadyAt = new Date(now.getTime() + REPORT_DELAY_MS).toISOString();
  const categoryScores = session.shadowJd.evaluationRubric.map((rubric) => {
    const { score, feedback } = calculateCategoryScore(rubric.category, transcript, proctoringLog);
    return {
      category: rubric.category,
      score,
      weight: rubric.weight,
      feedback
    };
  });

  const report = await generateCandidateReport({
    candidateName: session.candidateName,
    role: session.role,
    categoryScores,
    transcript,
    proctoringLog
  });

  const completed: InterviewSession = {
    ...session,
    status: "completed",
    endedAt,
    transcript,
    proctoringLog,
    reportReadyAt,
    report
  };

  getStore().set(id, completed);
  return completed;
};

export const getReportStatus = (
  interviewId: string,
  userId: string
):
  | { status: "missing" }
  | { status: "processing"; reportReadyAt: string }
  | { status: "ready"; report: CandidateFitReport; reportReadyAt: string } => {
  const session = getStore().get(interviewId);

  if (!session || session.userId !== userId || !session.report || !session.reportReadyAt) {
    return { status: "missing" };
  }

  if (Date.now() < new Date(session.reportReadyAt).getTime()) {
    return {
      status: "processing",
      reportReadyAt: session.reportReadyAt
    };
  }

  return {
    status: "ready",
    report: session.report,
    reportReadyAt: session.reportReadyAt
  };
};

export const listDashboardReportItems = (userId: string): DashboardReportItem[] => {
  return Array.from(getStore().values())
    .filter((session) => session.userId === userId)
    .map((session) => {
      if (session.status === "in_progress") {
        return {
          interviewId: session.id,
          candidateName: session.candidateName,
          role: session.role,
          status: "in_progress",
          createdAt: session.createdAt
        } satisfies DashboardReportItem;
      }

      const reportStatus = getReportStatus(session.id, userId);
      if (reportStatus.status === "ready") {
        return {
          interviewId: session.id,
          candidateName: session.candidateName,
          role: session.role,
          status: "ready",
          createdAt: session.createdAt,
          reportReadyAt: reportStatus.reportReadyAt,
          overallScore: reportStatus.report.overallScore,
          verdict: reportStatus.report.verdict
        } satisfies DashboardReportItem;
      }

      return {
        interviewId: session.id,
        candidateName: session.candidateName,
        role: session.role,
        status: "processing",
        createdAt: session.createdAt,
        ...(session.reportReadyAt ? { reportReadyAt: session.reportReadyAt } : {})
      } satisfies DashboardReportItem;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
