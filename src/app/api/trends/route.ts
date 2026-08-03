import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const areas = new Set(["audio", "video", "both"]);
const maturities = new Set(["early_signal", "growing", "standard"]);

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as { title?: string; summary?: string; area?: string; maturity?: string };
  const title = body.title?.trim(); const summary = body.summary?.trim();
  const area = body.area === "Video" ? "video" : body.area === "Audio & Video" ? "both" : "audio";
  const maturity = body.maturity === "Branchenstandard" ? "standard" : body.maturity === "Im Aufschwung" ? "growing" : "early_signal";
  if (!title || !summary || !areas.has(area) || !maturities.has(maturity)) return NextResponse.json({ error: "Bitte Titel, Einordnung, Bereich und Reifegrad angeben." }, { status: 400 });
  const { data, error } = await supabase.from("trend_signals").insert({ title, summary, area, maturity, status: "published", origin: "manual" }).select("id").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data }, { status: 201 });
}
