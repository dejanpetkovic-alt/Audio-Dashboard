import type { Case, Metric } from "./types";
import { getSupabaseAdmin } from "./supabase";

type DatabaseMetric = { kind: string; value_numeric: number | null; value_text: string | null; unit: string | null; period: string | null; evidence_url: string; evidence_label: string };
type DatabaseCase = {
  id: string; title: string; canonical_url: string; excerpt: string | null; summary: string | null; medium: "audio" | "video";
  sector: "publisher" | "other_industry"; market: "dach" | "international"; platform: "web" | "app" | "web_and_app";
  format: string | null; tags: string[]; published_at: string | null; status: "review" | "published" | "rejected";
  sources: { name: string } | null; performance_metrics: DatabaseMetric[] | null;
};
type DatabaseSource = { id: string; name: string; homepage_url: string; feed_url: string | null; access: "public" | "member_link_only"; active: boolean; last_fetched_at: string | null };
type DatabaseRun = { source_id: string; status: "running" | "completed" | "failed"; started_at: string; error: string | null };

export type SourceOverview = {
  id: string; name: string; homepageUrl: string; feedUrl: string | null; access: "public" | "member_link_only";
  active: boolean; lastFetchedAt: string | null; latestRunStatus: "running" | "completed" | "failed" | null; latestRunError: string | null;
};

const sourceFallback = ["Alle Quellen", "INMA", "The Audiencers", "WAN-IFRA", "Nieman Lab", "Digiday"];
const labels: Record<string, string> = { audio: "Audio", video: "Video", publisher: "Publisher", other_industry: "Andere Branchen", dach: "DACH", international: "International", web: "Web", app: "App", web_and_app: "Web & App", review: "In Prüfung", published: "Freigegeben", rejected: "Abgelehnt" };
const label = (value: string) => labels[value] ?? value;

function mapMetric(metric: DatabaseMetric): Metric {
  const value = metric.value_numeric !== null ? `${metric.value_numeric}${metric.unit ? ` ${metric.unit}` : ""}` : (metric.value_text ?? "nicht veröffentlicht");
  return { label: label(metric.kind).replaceAll("_", " "), value, source: [metric.evidence_label, metric.period].filter(Boolean).join(" · "), kind: metric.kind, unit: metric.unit, period: metric.period, evidenceUrl: metric.evidence_url };
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
  if (!supabase) return { cases: [] as Case[], sourceNames: sourceFallback, sources: [] as SourceOverview[], connected: false, loadError: false };
  try {
    const [casesResult, sourcesResult, runsResult] = await Promise.all([
      supabase.from("cases").select("*, sources(name), performance_metrics(kind,value_numeric,value_text,unit,period,evidence_url,evidence_label)").order("published_at", { ascending: false }),
      supabase.from("sources").select("id,name,homepage_url,feed_url,access,active,last_fetched_at").order("name"),
      supabase.from("ingestion_runs").select("source_id,status,started_at,error").order("started_at", { ascending: false }),
    ]);
    if (casesResult.error) throw new Error(`Supabase cases query failed: ${casesResult.error.message}`);
    if (sourcesResult.error) throw new Error(`Supabase sources query failed: ${sourcesResult.error.message}`);
    if (runsResult.error) throw new Error(`Supabase ingestion query failed: ${runsResult.error.message}`);
    const latestRuns = new Map<string, DatabaseRun>();
    for (const run of (runsResult.data ?? []) as DatabaseRun[]) if (!latestRuns.has(run.source_id)) latestRuns.set(run.source_id, run);
    const sources = ((sourcesResult.data ?? []) as DatabaseSource[]).map((source) => ({
      id: source.id, name: source.name, homepageUrl: source.homepage_url, feedUrl: source.feed_url, access: source.access,
      active: source.active, lastFetchedAt: source.last_fetched_at, latestRunStatus: latestRuns.get(source.id)?.status ?? null, latestRunError: latestRuns.get(source.id)?.error ?? null,
    }));
    return { cases: ((casesResult.data ?? []) as DatabaseCase[]).map(mapCase), sourceNames: ["Alle Quellen", ...sources.filter((source) => source.active).map((source) => source.name)], sources, connected: true, loadError: false };
  } catch (error) {
    console.error("Media Pulse database load failed:", error);
    return { cases: [] as Case[], sourceNames: sourceFallback, sources: [] as SourceOverview[], connected: false, loadError: true };
  }
}
