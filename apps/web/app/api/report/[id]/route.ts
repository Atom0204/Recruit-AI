import { NextResponse } from "next/server";
import { getReportStatus } from "../../../../lib/interview-memory-store";

interface ParamsContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: ParamsContext): Promise<NextResponse> {
  const { id } = await context.params;
  const status = getReportStatus(id);

  if (status.status === "missing") {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}
