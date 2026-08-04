import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const targetTypes = ["website", "audio_hub", "video_hub", "help", "app_store"];
function validUrl(value: unknown) { if (typeof value !== "string") return null; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin(); if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as Record<string, unknown>; const sourceId = typeof body.publisherSourceId === "string" ? body.publisherSourceId : ""; const url = validUrl(body.url); const targetType = typeof body.targetType === "string" ? body.targetType : "";
  if (!sourceId || !url || !targetTypes.includes(targetType)) return NextResponse.json({ error: "Publisher, URL und Zieltyp sind erforderlich." }, { status: 400 });
  const { error } = await supabase.from("publisher_scan_targets").upsert({ publisher_source_id: sourceId, url, target_type: targetType, active: true }, { onConflict: "publisher_source_id,url" });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true }, { status: 201 });
}
