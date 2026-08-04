import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const statuses = ["research", "evaluate", "build", "done"];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin(); if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await context.params; const body = await request.json() as Record<string, unknown>; const update: Record<string, string> = {};
  if (typeof body.status === "string" && statuses.includes(body.status)) update.status = body.status;
  if (typeof body.assignee === "string") update.assignee = body.assignee.trim();
  if (!Object.keys(update).length) return NextResponse.json({ error: "Keine gültige Änderung übergeben." }, { status: 400 });
  const { error } = await supabase.from("feature_lab_items").update(update).eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin(); if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await context.params; const { error } = await supabase.from("feature_lab_items").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
