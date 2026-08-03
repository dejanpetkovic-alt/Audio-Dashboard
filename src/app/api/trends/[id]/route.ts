import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type EvidenceInput = { source?: unknown; title?: unknown; url?: unknown; publishedAt?: unknown };
type AssessmentInput = { featureId?: unknown; status?: unknown; rationale?: unknown };
const statuses = new Set(["covered", "gap", "watch", "pioneer"]);

function validUrl(value: unknown) { if (typeof value !== "string") return null; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await context.params; const body = await request.json() as { title?: unknown; summary?: unknown; area?: unknown; maturity?: unknown; status?: unknown; evidence?: EvidenceInput[]; assessments?: AssessmentInput[] };
  const title = typeof body.title === "string" ? body.title.trim() : ""; const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const area = body.area === "Video" ? "video" : body.area === "Audio & Video" ? "both" : "audio"; const maturity = body.maturity === "Branchenstandard" ? "standard" : body.maturity === "Im Aufschwung" ? "growing" : "early_signal";
  const evidence = (Array.isArray(body.evidence) ? body.evidence : []).map((item) => ({ source_name: typeof item.source === "string" ? item.source.trim() : "", title: typeof item.title === "string" ? item.title.trim() : "", url: validUrl(item.url), published_at: typeof item.publishedAt === "string" && item.publishedAt ? item.publishedAt : null })).filter((item) => item.source_name || item.title || item.url);
  if (!title || !summary) return NextResponse.json({ error: "Titel und Einordnung sind erforderlich." }, { status: 400 });
  if (evidence.some((item) => !item.source_name || !item.title || !item.url)) return NextResponse.json({ error: "Jeder Beleg braucht Quelle, Titel und eine gültige URL." }, { status: 400 });
  const assessmentMap: Record<string, string> = { Abgedeckt: "covered", Lücke: "gap", Beobachten: "watch", Pionier: "pioneer" };
  const assessments = (Array.isArray(body.assessments) ? body.assessments : []).map((item) => ({ product_feature_id: typeof item.featureId === "string" ? item.featureId : "", status: assessmentMap[String(item.status)] ?? "", rationale: typeof item.rationale === "string" ? item.rationale.trim() : "" })).filter((item) => item.product_feature_id || item.status || item.rationale);
  if (assessments.some((item) => !item.product_feature_id || !statuses.has(item.status) || !item.rationale)) return NextResponse.json({ error: "Jede Feature-Einordnung benötigt Status und kurze Begründung." }, { status: 400 });
  const { error: trendError } = await supabase.from("trend_signals").update({ title, summary, area, maturity, status: "published" }).eq("id", id);
  if (trendError) return NextResponse.json({ error: trendError.message }, { status: 500 });
  const { error: evidenceDeleteError } = await supabase.from("trend_evidence").delete().eq("trend_id", id); if (evidenceDeleteError) return NextResponse.json({ error: evidenceDeleteError.message }, { status: 500 });
  if (evidence.length) { const { error } = await supabase.from("trend_evidence").insert(evidence.map((item) => ({ ...item, trend_id: id }))); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); }
  const { error: assessmentDeleteError } = await supabase.from("trend_feature_assessments").delete().eq("trend_id", id); if (assessmentDeleteError) return NextResponse.json({ error: assessmentDeleteError.message }, { status: 500 });
  if (assessments.length) { const { error } = await supabase.from("trend_feature_assessments").insert(assessments.map((item) => ({ ...item, trend_id: id }))); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
