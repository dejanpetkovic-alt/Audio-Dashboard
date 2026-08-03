import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "media_pulse_session";

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function hasValidSession(token: string | undefined) {
  if (!token || !process.env.AUTH_SECRET) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(process.env.AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), new TextEncoder().encode(payload));
  if (!valid) return false;
  try { return (JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as { exp?: number }).exp! > Math.floor(Date.now() / 1000); } catch { return false; }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/login") || path.startsWith("/api/auth") || path.startsWith("/api/health")) return NextResponse.next();
  if (await hasValidSession(request.cookies.get(COOKIE_NAME)?.value)) return NextResponse.next();
  const login = new URL("/login", request.url); login.searchParams.set("next", path);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
