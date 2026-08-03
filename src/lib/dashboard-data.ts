import type { Case, Metric } from "./types";
import { getSupabaseAdmin } from "./supabase";

type DatabaseMetric = { kind: string; value_numeric: number | null; value_text: string | null; unit: string | null; period: string | null; evidence_label: string };
type DatabaseCase = {
  id: string; title: string; canonical_url: string; excerpt: string | null; summary: string | null; medium: "audio" | "video";
  sector: "publisher" | "other_industry"; market: "dach" | "international"; platform: "web" | "app" | "web_and_app";
  format: string | null; tags: string[]; published_at: string | null; status: "review" | "published" | "rejected";
  sources: { name: string } | null; performance_metrics: DatabaseMetric[] | null;
};

const sourceFallback = ["Alle Quellen", "INMA", "The Audiencers", "WAN-IFRA", "Nieman Lab", "Digiday"];
const labels: Record<string, string> = { audio: "Audio", video: "Video", publisher: "Publisher", other_industry: "Andere Branchen", dach: "DACH", international: "International", web: "Web", app: "App", web_and_app: "Web & App", review: "In Prüfung", published: "Freigegeben", rejected: "Abgelehnt" };
const label = (value: string) => labels[value] ?? value;

function mapMetric(metric: DatabaseMetric): Metric {
  const value = metric.value_numeric !== null ? `${metric.value_numeric}${metric.unit ? ` ${metric.unit}` : ""}` : (metric.value_text ?? "nicht veröffentlicht");
  return { label: label(metric.kind).replaceAll("_", " "), value, source: [metric.evidence_label, metric.period].filter(Boolean).join(" · ") };
}

function mapCase(item: DatabaseCase): Case {
  return {
    id: item.id, title: item.title, source: item.sources?.name ?? "Unbekannte Quelle", sourceType: "Netzwerk", url: item.canonical_url,
    excerpt: item.excerpt ?? "", summary: item.summary ?? "Noch keine redaktionelle Kurzfassung.", medium: label(item.medium) as Case["medium"],
    sector: label(item.sector) as Case["sector"], market: label(item.market) as Case["market"], platform: label(item.platform) as Case["platform"],
    format: item.format ?? "Best Practice", tags: item.tags ?? [], publishedAt: item.published_at ?? new Date().toISOString(),
    status: label(item.status) as Case["status"], metrics: (item.performance_metrics ?? []).map(mapMetric),
    context: item.excerpt ?? "Noch nicht ergänzt.", action: item.summary ?? "Noch nicht ergänzt.", isNew: false,
  };
}

export async function getDashboardData() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { cases: [] as Case[], sourceNames: sourceFallback, connected: false };
  const [casesResult, sourcesResult] = await Promise.all([
    supabase.from("cases").select("*, sources(name), performance_metrics(kind,value_numeric,value_text,unit,period,evidence_label)").order("published_at", { ascending: false }),
    supabase.from("sources").select("name").eq("active", true).order("name"),
  ]);
  if (casesResult.error) throw new Error(`Supabase cases query failed: ${casesResult.error.message}`);
  if (sourcesResult.error) throw new Error(`Supabase sources query failed: ${sourcesResult.error.message}`);
  return { cases: ((casesResult.data ?? []) as DatabaseCase[]).map(mapCase), sourceNames: ["Alle Quellen", ...(sourcesResult.data ?? []).map((source) => source.name)], connected: true };
}
