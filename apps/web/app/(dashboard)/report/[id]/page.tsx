import type { CandidateFitReport } from "@recruitai/shared";
import { PageTransition } from "../../../../components/page-transition";
import { LiveReportView } from "../../../../components/report/live-report-view";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

const demoReport: CandidateFitReport = {
  candidateName: "Demo Candidate",
  role: "Senior Full-Stack Engineer",
  date: new Date().toISOString(),
  overallScore: 84,
  verdict: "Hire",
  categoryScores: [
    { category: "Technical Depth", score: 86, weight: 0.35, feedback: "Strong implementation detail." },
    { category: "System Design", score: 80, weight: 0.25, feedback: "Solid architecture decisions." },
    { category: "Problem Solving", score: 83, weight: 0.2, feedback: "Clear iterative reasoning." },
    { category: "Communication", score: 87, weight: 0.2, feedback: "Structured and concise answers." }
  ],
  sentimentAnalysis: {
    overallConfidence: 81,
    emotionalArc: [
      { question: 1, sentiment: "neutral", confidence: 76 },
      { question: 2, sentiment: "positive", confidence: 84 },
      { question: 3, sentiment: "anxious", confidence: 68 },
      { question: 4, sentiment: "positive", confidence: 86 },
      { question: 5, sentiment: "neutral", confidence: 79 }
    ],
    flags: ["Slight hesitation during system design"]
  },
  areasOfStrength: ["Technical Depth", "Communication"],
  areasForImprovement: ["System Design"],
  recommendedResources: [
    {
      topic: "System Design",
      resource: "Designing Data-Intensive Applications",
      url: "https://dataintensive.net/"
    }
  ],
  transcript: [
    { speaker: "AI", text: "Tell me about a project you owned end-to-end.", timestamp: new Date().toISOString() },
    { speaker: "Candidate", text: "I led a migration from monolith to services...", timestamp: new Date().toISOString() }
  ],
  proctoringLog: [],
  generatedAt: new Date().toISOString()
};

export default async function ReportPage({ params }: ReportPageProps) {
  const resolvedParams = await params;
  const interviewId = resolvedParams.id;

  return (
    <PageTransition state="result">
      <LiveReportView interviewId={interviewId} fallbackReport={demoReport} />
    </PageTransition>
  );
}
