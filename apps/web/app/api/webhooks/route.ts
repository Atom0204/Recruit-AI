import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
