import { NextRequest, NextResponse } from "next/server";
import { destroySessionToken, getSessionCookieName } from "../../../../lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (token) {
    destroySessionToken(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}
