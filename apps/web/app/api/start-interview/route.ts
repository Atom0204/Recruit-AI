import type { ParsedResume, ShadowJobDescription } from "@recruitai/shared";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { createInterviewSession } from "../../../lib/interview-memory-store";
import { getUserIdFromRequest } from "../../../lib/auth";

const payloadSchema = z.object({
  resume: z.custom<ParsedResume>(),
  shadowJd: z.custom<ShadowJobDescription>()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateKey = request.headers.get("x-forwarded-for") ?? "anonymous";

  if (!enforceRateLimit({ key: `start:${rateKey}`, limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const session = await createInterviewSession(userId, parsed.data.resume, parsed.data.shadowJd);

  return NextResponse.json({
    interview: {
      id: session.id,
      status: "in_progress",
      currentQuestionIndex: 0,
      candidateName: session.candidateName,
      role: session.role,
      questions: session.questions,
      responses: [],
      confidenceTracker: [],
      branchHistory: [],
      overallTrajectory: "stable"
    }
  });
}
