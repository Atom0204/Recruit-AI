import type { CandidateFitReport } from "@recruitai/shared";
import { PageTransition } from "../../../../components/page-transition";
import { LiveReportView } from "../../../../components/report/live-report-view";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const resolvedParams = await params;
  const interviewId = resolvedParams.id;

  // No fallback - users should only see their actual interview reports
  return (
    <PageTransition state="result">
      <LiveReportView interviewId={interviewId} />
    </PageTransition>
  );
}
