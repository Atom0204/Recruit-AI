import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, getSessionCookieName, registerUser } from "../../../../lib/auth";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(6).max(120)
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
    const token = createSessionToken(user.id);

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email }
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    );
  }
}
