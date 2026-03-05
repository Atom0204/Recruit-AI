import { NextRequest, NextResponse } from "next/server";
import { getReportStatus } from "../../../../lib/interview-memory-store";
import { getUserIdFromRequest } from "../../../../lib/auth";

interface ParamsContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: ParamsContext): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const status = getReportStatus(id, userId);

  if (status.status === "missing") {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}
