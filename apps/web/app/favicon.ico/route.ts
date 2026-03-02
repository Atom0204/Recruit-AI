import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL("/icon.svg", request.url);
  return NextResponse.redirect(url, { status: 307 });
}
