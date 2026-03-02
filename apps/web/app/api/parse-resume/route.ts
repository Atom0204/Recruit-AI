import { parseResumeFromText } from "@recruitai/ai-service";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "../../../lib/rate-limit";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const rateKey = request.headers.get("x-forwarded-for") ?? "anonymous";

  if (!enforceRateLimit({ key: `parse:${rateKey}`, limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing resume file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
  }

  // Placeholder text extraction: replace with pdf-parse/pdfjs + OCR fallback for image-heavy PDFs.
  const rawText = await file.text();
  const parsedResume = await parseResumeFromText(rawText);

  return NextResponse.json({ parsedResume });
}
