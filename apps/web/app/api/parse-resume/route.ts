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

  let rawText: string;

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    // Dynamic import to avoid webpack bundling issues with pdf-parse native deps
    const { PDFParse } = await import("pdf-parse");
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    const result = await parser.getText();
    rawText = result.text;
  } else {
    rawText = await file.text();
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: "Could not extract text from the file. Try a different PDF." }, { status: 422 });
  }

  const parsedResume = await parseResumeFromText(rawText);

  return NextResponse.json({ parsedResume });
}
