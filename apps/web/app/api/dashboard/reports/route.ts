import { NextResponse } from "next/server";
import { listDashboardReportItems } from "../../../../lib/interview-memory-store";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ items: listDashboardReportItems() });
}
