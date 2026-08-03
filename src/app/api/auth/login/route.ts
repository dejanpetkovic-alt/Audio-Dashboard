import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_SECONDS = 60 * 60 * 24 * 14;
function matches(input: string, expected: string) { const a = Buffer.from(input), b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b); }

export async function POST(request: NextRequest) {
  const { password } = await request.json() as { password?: string };
  const expected = process.env.DASHBOARD_PASSWORD, secret = process.env.AUTH_SECRET;
  if (!expected || !secret) return NextResponse.json({ error: "Zugang ist noch nicht konfiguriert." }, { status: 503 });
  if (!password || !matches(password, expected)) return NextResponse.json({ error: "Das Passwort ist nicht korrekt." }, { status: 401 });
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  const response = NextResponse.json({ ok: true });
  response.cookies.set("media_pulse_session", `${payload}.${signature}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
  return response;
}
