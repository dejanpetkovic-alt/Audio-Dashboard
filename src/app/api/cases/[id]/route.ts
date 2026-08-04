import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const allowed = { medium: ["audio", "video"], sector: ["publisher", "other_industry"], market: ["dach", "international"], platform: ["web", "app", "web_and_app"], region: ["dach", "europe", "north_america", "global"], observationStatus: ["read", "watch", "test", "share"], aiRelevance: ["low", "medium", "high"], audioRelevance: ["low", "medium", "high"], videoRelevance: ["low", "medium", "high"] };
const metricKinds = ["reach", "engagement", "watch_time", "listen_time", "completion", "conversion", "subscriptions", "revenue", "production_effort"];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin(); if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await context.params; const body = await request.json() as Record<string, unknown>;
  const strings = ["title", "excerpt", "summary", "format", "subcategory", "whyRelevant"] as const; const title = typeof body.title === "string" ? body.title.trim() : "";
  if (strings.some((field) => typeof body[field] !== "string") || !title) return NextResponse.json({ error: "Titel und Textfelder sind ungültig." }, { status: 400 });
  if (Object.entries(allowed).some(([field, values]) => typeof body[field] !== "string" || !values.includes(body[field] as string))) return NextResponse.json({ error: "Eine Auswahl ist ungültig." }, { status: 400 });
  const stringArray = (value: unknown, limit: number) => Array.isArray(value) && value.every((item) => typeof item === "string") ? value.map((item) => item.trim()).filter(Boolean).slice(0, limit) : null;
  const tags = stringArray(body.tags, 12), categories = stringArray(body.categories, 12), affectedPlatforms = stringArray(body.affectedPlatforms, 12);
  if (!tags || !categories || !affectedPlatforms || typeof body.publisherRelated !== "boolean" || typeof body.examplesMentioned !== "boolean") return NextResponse.json({ error: "Listen oder Schalter sind ungültig." }, { status: 400 });
  const metrics = Array.isArray(body.metrics) ? body.metrics : [];
  if (metrics.some((metric) => !metric || typeof metric !== "object" || !metricKinds.includes((metric as { kind?: string }).kind ?? "") || typeof (metric as { value?: unknown }).value !== "string" || typeof (metric as { evidenceUrl?: unknown }).evidenceUrl !== "string" || typeof (metric as { evidenceLabel?: unknown }).evidenceLabel !== "string")) return NextResponse.json({ error: "Eine Kennzahl ist unvollständig." }, { status: 400 });
  const { error: updateError } = await supabase.from("cases").update({ title, excerpt: (body.excerpt as string).trim(), summary: (body.summary as string).trim(), format: (body.format as string).trim(), tags, medium: body.medium, sector: body.sector, market: body.market, platform: body.platform, region: body.region, categories, subcategory: (body.subcategory as string).trim() || null, affected_platforms: affectedPlatforms, publisher_related: body.publisherRelated, why_relevant: (body.whyRelevant as string).trim() || null, observation_status: body.observationStatus, examples_mentioned: body.examplesMentioned, ai_relevance: body.aiRelevance, audio_relevance: body.audioRelevance, video_relevance: body.videoRelevance }).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  const { error: deleteError } = await supabase.from("performance_metrics").delete().eq("case_id", id); if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  if (metrics.length) { const rows = metrics.map((metric) => { const value = metric as { kind: string; value: string; unit?: string; period?: string; evidenceUrl: string; evidenceLabel: string }; return { case_id: id, kind: value.kind, value_text: value.value.trim(), unit: value.unit?.trim() || null, period: value.period?.trim() || null, evidence_url: value.evidenceUrl.trim(), evidence_label: value.evidenceLabel.trim() }; }); const { error: metricError } = await supabase.from("performance_metrics").insert(rows); if (metricError) return NextResponse.json({ error: metricError.message }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
