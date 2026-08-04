import { NextRequest, NextResponse } from "next/server";
import { buildImplementationBrief, calculateCopyability } from "@/lib/feature-lab-utils";
import { inspectReference } from "@/lib/reference-inspection";
import { screenshotUrl } from "@/lib/screenshot";
import { getSupabaseAdmin } from "@/lib/supabase";

const statusMap: Record<string, string> = { "Aktuell dokumentiert": "current", Historisch: "historical", Unklar: "unclear" };
const qualityMap: Record<string, string> = { "Direkt belegt": "direct", Branchenquelle: "industry_report", "Zu verifizieren": "to_verify" };
function validUrl(value: unknown) { if (typeof value !== "string") return null; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as { sourceId?: unknown; observedFeature?: unknown; productFeatureId?: unknown; platforms?: unknown; status?: unknown; evidenceQuality?: unknown; originTrendId?: unknown; evidenceUrl?: unknown; evidenceLabel?: unknown; notes?: unknown };
  const sourceId = typeof body.sourceId === "string" ? body.sourceId : ""; const observedFeature = typeof body.observedFeature === "string" ? body.observedFeature.trim() : ""; const evidenceUrl = validUrl(body.evidenceUrl); const evidenceLabel = typeof body.evidenceLabel === "string" ? body.evidenceLabel.trim() : "";
  const platforms = Array.isArray(body.platforms) ? body.platforms.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
  if (!sourceId || !observedFeature || !evidenceUrl || !evidenceLabel || !statusMap[String(body.status)] || !qualityMap[String(body.evidenceQuality)]) return NextResponse.json({ error: "Bitte Publisher, Feature, Status, Belegqualität und vollständigen Quellenbeleg angeben." }, { status: 400 });
  const trendSignalId = typeof body.originTrendId === "string" && body.originTrendId ? body.originTrendId : null; const notes = typeof body.notes === "string" ? body.notes.trim() : ""; const quality = qualityMap[String(body.evidenceQuality)];
  const { data, error } = await supabase.from("publisher_feature_observations").insert({ publisher_source_id: sourceId, observed_feature: observedFeature, product_feature_id: typeof body.productFeatureId === "string" && body.productFeatureId ? body.productFeatureId : null, trend_signal_id: trendSignalId, platforms, status: statusMap[String(body.status)], evidence_quality: quality, evidence_url: evidenceUrl, evidence_label: evidenceLabel, notes }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const visibility: "clear" | "partial" | "unclear" = quality === "direct" ? "clear" : quality === "industry_report" ? "partial" : "unclear";
  const productValue = trendSignalId ? "high" : "medium" as const;
  const inspection = await inspectReference(evidenceUrl);
  const sourceResult = await supabase.from("sources").select("name").eq("id", sourceId).single();
  const technicalNotes = ["Vor dem Nachbau UI-Ablauf, Datenquellen, technische Komponenten und offene Produktannahmen prüfen.", inspection.notes].join("\n\n");
  const { error: labError } = await supabase.from("feature_lab_items").upsert({ publisher_source_id: sourceId, trend_signal_id: trendSignalId, publisher_observation_id: data.id, product_name: observedFeature, feature_description: notes || "Automatisch aus einer belegten Publisher-Beobachtung übernommen.", reference_url: evidenceUrl, screenshot_url: screenshotUrl(evidenceUrl), copyability: calculateCopyability(visibility, "medium", productValue), implementation_effort: "medium", visibility, product_value: productValue, build_priority: quality === "direct" ? "now" : "watch", status: "research", rationale: quality === "direct" ? "Direkt beim Publisher belegt." : quality === "industry_report" ? "Von einer Branchenquelle berichtet; Produktseite bei Bedarf gegenprüfen." : "Signal vor dem Nachbau verifizieren.", technical_notes: technicalNotes, assignee: "", detected_tech: inspection.detectedTech, inspection_status: inspection.status, implementation_brief: buildImplementationBrief({ productName: observedFeature, publisher: sourceResult.data?.name ?? "Unbekannter Publisher", description: notes || "Automatisch aus einer belegten Publisher-Beobachtung übernommen.", referenceUrl: evidenceUrl, technicalNotes, detectedTech: inspection.detectedTech }) }, { onConflict: "publisher_source_id,reference_url", ignoreDuplicates: true });
  return labError ? NextResponse.json({ error: labError.message }, { status: 500 }) : NextResponse.json({ data, featureLabCreated: true }, { status: 201 });
}
