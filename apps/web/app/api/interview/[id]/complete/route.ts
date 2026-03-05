import type { ProctoringEvent, TranscriptEntry } from "@recruitai/shared";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { completeInterviewSession } from "../../../../../lib/interview-memory-store";
import { getUserIdFromRequest } from "../../../../../lib/auth";

interface ParamsContext {
  params: Promise<{ id: string }>;
}

const payloadSchema = z.object({
  transcript: z.array(
    z.object({
      speaker: z.enum(["AI", "Candidate"]),
      text: z.string().min(1),
      timestamp: z.string().min(1)
    })
  ),
  proctoringLog: z.array(
    z.object({
      timestamp: z.string().min(1),
      type: z.enum(["TAB_SWITCH", "GAZE_AWAY", "FACE_NOT_DETECTED", "AUDIO_ANOMALY", "CLIPBOARD_PASTE"]),
      severity: z.enum(["low", "medium", "high"]),
      details: z.string().min(1)
    })
  )
});

export async function POST(request: NextRequest, context: ParamsContext): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const transcript = parsed.data.transcript as TranscriptEntry[];
  const proctoringLog = parsed.data.proctoringLog as ProctoringEvent[];
  const session = await completeInterviewSession(id, userId, transcript, proctoringLog);

  if (!session || !session.reportReadyAt) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "processing",
    interviewId: id,
    reportReadyAt: session.reportReadyAt
  });
}
