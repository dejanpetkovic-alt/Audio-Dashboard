import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function mondayIso() { const date = new Date(); const day = date.getDay() || 7; date.setDate(date.getDate() - day + 1); date.setHours(0, 0, 0, 0); return date.toISOString().slice(0, 10); }

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin(); if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as { groupId?: unknown; status?: unknown }; const groupId = typeof body.groupId === "string" ? body.groupId : ""; const status = body.status === "selected" || body.status === "dismissed" ? body.status : null;
  if (!groupId || !status) return NextResponse.json({ error: "Feature und Status sind erforderlich." }, { status: 400 });
  const { error } = await supabase.from("weekly_feature_reviews").upsert({ feature_group_id: groupId, week_start: mondayIso(), status }, { onConflict: "feature_group_id,week_start" });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
