import type { Case, Metric, ProductFeature, PublisherFeatureObservation, TrendSignal } from "./types";
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
type DatabaseFeature = { id: string; title: string; area: "audio" | "video"; status: "live" | "in_progress" | "planned"; surfaces: string[]; description: string };
type DatabaseTrend = { id: string; title: string; summary: string; area: "audio" | "video" | "both"; maturity: "early_signal" | "growing" | "standard"; status: "draft" | "published"; origin: "manual" | "automation"; observed_at: string };
type DatabaseTrendEvidence = { id: string; trend_id: string; source_name: string; title: string; url: string; published_at: string | null };
type DatabaseTrendAssessment = { trend_id: string; product_feature_id: string; status: "covered" | "gap" | "watch" | "pioneer"; rationale: string };
type Related<T> = T | T[] | null;
type DatabasePublisherFeatureObservation = { id: string; observed_feature: string; platforms: string[]; status: "current" | "historical" | "unclear"; evidence_url: string; evidence_label: string; observed_at: string; notes: string; sources: Related<{ name: string }>; product_features: Related<{ id: string; title: string }> };

export type SourceOverview = {
  id: string; name: string; homepageUrl: string; feedUrl: string | null; access: "public" | "member_link_only";
  active: boolean; lastFetchedAt: string | null; latestRunStatus: "running" | "completed" | "failed" | null; latestRunError: string | null;
};

const sourceFallback = ["Alle Quellen", "INMA", "The Audiencers", "WAN-IFRA", "Nieman Lab", "Digiday"];
const featureFallback: ProductFeature[] = [
  { id: "tts-apps", title: "Artikelvertonung in den Apps", area: "Audio", status: "Live", surfaces: ["Webview", "E-Paper", "Nativer Player"], description: "Vertonte Artikel aus Webview und E-Paper werden im nativen Player ausgespielt." },
  { id: "morning-reports", title: "KI-generierte Morgenreports", area: "Audio", status: "Live", surfaces: ["Webview", "Lokalteile"], description: "Tägliches Audio-Briefing mit drei aktuellen Artikeln und Wetter für jeden Lokalteil." },
  { id: "topic-reports", title: "KI-generierte Themenreports", area: "Audio", status: "Live", surfaces: ["Webview", "Audience-Themen"], description: "Thematische Briefings für Angebote wie Familie oder Blaulicht." },
  { id: "audio-hub", title: "Audio-Hub", area: "Audio", status: "Live", surfaces: ["App", "Audio"], description: "Zentraler Einstiegspunkt für alle Audio-Themen und -Formate." },
  { id: "manual-podcasts", title: "Redaktionelle Podcasts", area: "Audio", status: "Live", surfaces: ["Fußball", "True Crime", "Essen"], description: "Manuell produzierte Podcastformate für ausgewählte Themenfelder." },
  { id: "article-video", title: "Video-Player im Artikel", area: "Video", status: "Live", surfaces: ["Artikel", "Eigene Produktionen"], description: "Eigene Videoproduktionen werden direkt im passenden Artikel ausgespielt." },
  { id: "vertical-feed", title: "Vertical-Feed-Player", area: "Video", status: "Live", surfaces: ["App", "Vertikalvideo"], description: "Ein Reel-ähnlicher Feed für eigene vertikale Videos." },
  { id: "video-hub", title: "Video-Hub", area: "Video", status: "Live", surfaces: ["App", "Video"], description: "Zentraler Einstiegspunkt für alle Video-Themen und -Formate." },
];
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

function mapFeature(feature: DatabaseFeature): ProductFeature {
  return { id: feature.id, title: feature.title, area: feature.area === "audio" ? "Audio" : "Video", status: feature.status === "live" ? "Live" : feature.status === "in_progress" ? "In Arbeit" : "Geplant", surfaces: feature.surfaces ?? [], description: feature.description };
}

function mapTrend(trend: DatabaseTrend, evidence: DatabaseTrendEvidence[], assessments: DatabaseTrendAssessment[]): TrendSignal {
  const area = trend.area === "both" ? "Audio & Video" : trend.area === "audio" ? "Audio" : "Video";
  const maturity = trend.maturity === "early_signal" ? "Frühes Signal" : trend.maturity === "growing" ? "Im Aufschwung" : "Branchenstandard";
  const state: Record<DatabaseTrendAssessment["status"], "Abgedeckt" | "Lücke" | "Beobachten" | "Pionier"> = { covered: "Abgedeckt", gap: "Lücke", watch: "Beobachten", pioneer: "Pionier" };
  return { id: trend.id, title: trend.title, summary: trend.summary, area, maturity, status: trend.status === "published" ? "Veröffentlicht" : "Entwurf", origin: trend.origin === "automation" ? "Automatisch erkannt" : "Manuell", observedAt: trend.observed_at, evidence: evidence.filter((item) => item.trend_id === trend.id).map((item) => ({ id: item.id, source: item.source_name, title: item.title, url: item.url, publishedAt: item.published_at })), assessments: assessments.filter((item) => item.trend_id === trend.id).map((item) => ({ featureId: item.product_feature_id, status: state[item.status], rationale: item.rationale })) };
}

function mapPublisherObservation(item: DatabasePublisherFeatureObservation): PublisherFeatureObservation {
  const labels = { current: "Aktuell dokumentiert", historical: "Historisch", unclear: "Unklar" } as const;
  const source = Array.isArray(item.sources) ? item.sources[0] : item.sources;
  const productFeature = Array.isArray(item.product_features) ? item.product_features[0] : item.product_features;
  return { id: item.id, publisher: source?.name ?? "Unbekannter Publisher", observedFeature: item.observed_feature, platforms: item.platforms ?? [], status: labels[item.status], evidenceUrl: item.evidence_url, evidenceLabel: item.evidence_label, observedAt: item.observed_at, notes: item.notes ?? "", productFeatureId: productFeature?.id ?? null, productFeatureTitle: productFeature?.title ?? null };
}

export async function getDashboardData() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { cases: [] as Case[], sourceNames: sourceFallback, sources: [] as SourceOverview[], features: featureFallback, trends: [] as TrendSignal[], publisherObservations: [] as PublisherFeatureObservation[], connected: false, loadError: false };
  try {
    const [casesResult, sourcesResult, runsResult, featuresResult, trendsResult, evidenceResult, assessmentsResult, publisherObservationsResult] = await Promise.all([
      supabase.from("cases").select("*, sources(name), performance_metrics(kind,value_numeric,value_text,unit,period,evidence_url,evidence_label)").order("published_at", { ascending: false }),
      supabase.from("sources").select("id,name,homepage_url,feed_url,access,active,last_fetched_at").order("name"),
      supabase.from("ingestion_runs").select("source_id,status,started_at,error").order("started_at", { ascending: false }),
      supabase.from("product_features").select("id,title,area,status,surfaces,description").order("area").order("created_at"),
      supabase.from("trend_signals").select("id,title,summary,area,maturity,status,origin,observed_at").order("observed_at", { ascending: false }),
      supabase.from("trend_evidence").select("id,trend_id,source_name,title,url,published_at"),
      supabase.from("trend_feature_assessments").select("trend_id,product_feature_id,status,rationale"),
      supabase.from("publisher_feature_observations").select("id,observed_feature,platforms,status,evidence_url,evidence_label,observed_at,notes,sources(name),product_features(id,title)").order("observed_at", { ascending: false }),
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
    const features = featuresResult.error ? featureFallback : ((featuresResult.data ?? []) as DatabaseFeature[]).map(mapFeature);
    const trends = trendsResult.error ? [] : ((trendsResult.data ?? []) as DatabaseTrend[]).map((item) => mapTrend(item, evidenceResult.error ? [] : (evidenceResult.data ?? []) as DatabaseTrendEvidence[], assessmentsResult.error ? [] : (assessmentsResult.data ?? []) as DatabaseTrendAssessment[]));
    const publisherObservations = publisherObservationsResult.error ? [] : ((publisherObservationsResult.data ?? []) as DatabasePublisherFeatureObservation[]).map(mapPublisherObservation);
    return { cases: ((casesResult.data ?? []) as DatabaseCase[]).map(mapCase), sourceNames: ["Alle Quellen", ...sources.filter((source) => source.active).map((source) => source.name)], sources, features: features.length ? features : featureFallback, trends, publisherObservations, connected: true, loadError: false };
  } catch (error) {
    console.error("Media Pulse database load failed:", error);
    return { cases: [] as Case[], sourceNames: sourceFallback, sources: [] as SourceOverview[], features: featureFallback, trends: [] as TrendSignal[], publisherObservations: [] as PublisherFeatureObservation[], connected: false, loadError: true };
  }
}
