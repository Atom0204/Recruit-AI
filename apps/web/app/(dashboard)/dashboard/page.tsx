import { PageTransition } from "../../../components/page-transition";
import { DashboardReportBoard } from "../../../components/report/dashboard-report-board";

export default function DashboardPage() {
  return (
    <PageTransition state="result">
      <DashboardReportBoard />
    </PageTransition>
  );
}
