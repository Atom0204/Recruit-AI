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
  const candidateText = transcript
    .filter((entry) => entry.speaker === "Candidate")
    .map((entry) => entry.text)
    .join(" ")
    .toLowerCase();

  const detailSignals = ["because", "trade-off", "latency", "reliability", "test", "rollback", "impact"];
  const structureSignals = ["first", "second", "finally", "result", "outcome", "metric"];
  const hasTechnicalDepth = /(architecture|database|cache|queue|throughput|scalable|incident|debug)/i.test(candidateText);
  const hasCollaboration = /(team|stakeholder|mentor|feedback|alignment|conflict)/i.test(candidateText);
  const detailCount = detailSignals.filter((signal) => candidateText.includes(signal)).length;
  const structureCount = structureSignals.filter((signal) => candidateText.includes(signal)).length;

  const highSeverityCount = proctoringLog.filter((event) => event.severity === "high").length;
  const mediumSeverityCount = proctoringLog.filter((event) => event.severity === "medium").length;

  const base = 64;
  const categoryBonus =
    /technical|system/i.test(rubricCategory) && hasTechnicalDepth
      ? 12
      : /communication|culture/i.test(rubricCategory) && hasCollaboration
        ? 10
        : 6;
  const signalBonus = Math.min(12, detailCount * 2 + structureCount);
  const integrityPenalty = highSeverityCount * 7 + mediumSeverityCount * 3;

  const score = Math.max(30, Math.min(98, base + categoryBonus + signalBonus - integrityPenalty));
  const feedback =
    score >= 84
      ? "Strong evidence with clear examples and measurable outcomes."
      : score >= 72
        ? "Solid answer quality with room for sharper depth and impact metrics."
        : "Core signals were inconsistent; needs stronger structure and technical rigor.";

  return { score, feedback };
};

export const createInterviewSession = async (
  resume: ParsedResume,
  shadowJd: ShadowJobDescription
): Promise<InterviewSession> => {
  const { buildInterviewScript } = await import("@recruitai/ai-service");
  const questions = await buildInterviewScript(resume, shadowJd);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const session: InterviewSession = {
    id,
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

export const completeInterviewSession = async (
  id: string,
  transcript: TranscriptEntry[],
  proctoringLog: ProctoringEvent[]
): Promise<InterviewSession | null> => {
  const { generateCandidateReport } = await import("@recruitai/ai-service");
  const session = getStore().get(id);

  if (!session) {
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
  interviewId: string
):
  | { status: "missing" }
  | { status: "processing"; reportReadyAt: string }
  | { status: "ready"; report: CandidateFitReport; reportReadyAt: string } => {
  const session = getStore().get(interviewId);

  if (!session || !session.report || !session.reportReadyAt) {
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

export const listDashboardReportItems = (): DashboardReportItem[] => {
  return Array.from(getStore().values())
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

      const reportStatus = getReportStatus(session.id);
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
