import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function validUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data, error } = await supabase.from("sources").select("id,name,homepage_url,feed_url,access,active,last_fetched_at").order("name");
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as { name?: string; homepageUrl?: string; feedUrl?: string; access?: "public" | "member_link_only" };
  const name = body.name?.trim(); const homepageUrl = validUrl(body.homepageUrl); const feedUrl = body.feedUrl?.trim() ? validUrl(body.feedUrl) : null;
  if (!name || !homepageUrl || (body.feedUrl?.trim() && !feedUrl)) return NextResponse.json({ error: "Bitte Name und gültige URLs angeben." }, { status: 400 });
  const { data, error } = await supabase.from("sources").insert({ name, homepage_url: homepageUrl, feed_url: feedUrl, access: body.access === "member_link_only" ? "member_link_only" : "public" }).select("id").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data }, { status: 201 });
}
