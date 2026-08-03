import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await context.params;
  const reviewedAt = new Date().toISOString();
  const { error } = await supabase.from("cases").update({ status: "published", reviewed_at: reviewedAt, reviewed_by: "shared-password-user" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: decisionError } = await supabase.from("review_decisions").insert({ case_id: id, reviewer: "shared-password-user", decision: "approved" });
  if (decisionError) return NextResponse.json({ error: decisionError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
