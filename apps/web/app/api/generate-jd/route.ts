import { generateShadowJobDescription } from "@recruitai/ai-service";
import type { ParsedResume } from "@recruitai/shared";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "../../../lib/rate-limit";

const payloadSchema = z.object({
  resume: z.custom<ParsedResume>(),
  targetRole: z.string().optional()
});

export async function POST(request: Request): Promise<NextResponse> {
  const rateKey = request.headers.get("x-forwarded-for") ?? "anonymous";

  if (!enforceRateLimit({ key: `jd:${rateKey}`, limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const shadowJd = await generateShadowJobDescription(parsed.data.resume, parsed.data.targetRole);

  return NextResponse.json({ shadowJd });
}
