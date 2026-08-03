import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const statusMap: Record<string, string> = { "Aktuell dokumentiert": "current", Historisch: "historical", Unklar: "unclear" };
function validUrl(value: unknown) { if (typeof value !== "string") return null; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as { sourceId?: unknown; observedFeature?: unknown; productFeatureId?: unknown; platforms?: unknown; status?: unknown; evidenceUrl?: unknown; evidenceLabel?: unknown; notes?: unknown };
  const sourceId = typeof body.sourceId === "string" ? body.sourceId : ""; const observedFeature = typeof body.observedFeature === "string" ? body.observedFeature.trim() : ""; const evidenceUrl = validUrl(body.evidenceUrl); const evidenceLabel = typeof body.evidenceLabel === "string" ? body.evidenceLabel.trim() : "";
  const platforms = Array.isArray(body.platforms) ? body.platforms.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
  if (!sourceId || !observedFeature || !evidenceUrl || !evidenceLabel || !statusMap[String(body.status)]) return NextResponse.json({ error: "Bitte Publisher, Feature, Status und vollständigen Quellenbeleg angeben." }, { status: 400 });
  const { data, error } = await supabase.from("publisher_feature_observations").insert({ publisher_source_id: sourceId, observed_feature: observedFeature, product_feature_id: typeof body.productFeatureId === "string" && body.productFeatureId ? body.productFeatureId : null, platforms, status: statusMap[String(body.status)], evidence_url: evidenceUrl, evidence_label: evidenceLabel, notes: typeof body.notes === "string" ? body.notes.trim() : "" }).select("id").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data }, { status: 201 });
}
