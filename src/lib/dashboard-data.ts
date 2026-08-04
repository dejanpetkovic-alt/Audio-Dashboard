import type { Case, FeatureLabItem, Metric, ProductFeature, PublisherFeatureObservation, PublisherWatchlistItem, TrendSignal } from "./types";
import { getSupabaseAdmin } from "./supabase";
import type { FeatureDiscoveryGroup, PublisherScanTargetOverview, WeeklyFeatureReview } from "./discovery-types";

type DatabaseMetric = { kind: string; value_numeric: number | null; value_text: string | null; unit: string | null; period: string | null; evidence_url: string; evidence_label: string };
type DatabaseCase = {
  id: string; title: string; canonical_url: string; excerpt: string | null; summary: string | null; medium: "audio" | "video";
  sector: "publisher" | "other_industry"; market: "dach" | "international"; platform: "web" | "app" | "web_and_app";
  format: string | null; tags: string[]; published_at: string | null; discovered_at: string; status: "review" | "published" | "rejected";
  relevance_score: number; priority: "review_now" | "watch" | "background"; signal_type: "product" | "feature" | "trend" | "case" | "analysis" | "report";
  region: "dach" | "europe" | "north_america" | "global"; categories: string[]; subcategory: string | null; affected_platforms: string[]; publisher_related: boolean; why_relevant: string | null; observation_status: "read" | "watch" | "test" | "share"; examples_mentioned: boolean; ai_relevance: "low" | "medium" | "high"; audio_relevance: "low" | "medium" | "high"; video_relevance: "low" | "medium" | "high";
  sources: { name: string } | null; performance_metrics: DatabaseMetric[] | null;
};
type DatabaseSource = { id: string; name: string; homepage_url: string; feed_url: string | null; access: "public" | "member_link_only"; active: boolean; last_fetched_at: string | null };
type DatabaseRun = { source_id: string; status: "running" | "completed" | "failed"; started_at: string; error: string | null };
type DatabaseFeature = { id: string; title: string; area: "audio" | "video"; status: "live" | "in_progress" | "planned"; surfaces: string[]; description: string };
type DatabaseTrend = { id: string; title: string; summary: string; area: "audio" | "video" | "both"; maturity: "early_signal" | "growing" | "standard"; status: "draft" | "published"; origin: "manual" | "automation"; observed_at: string };
type DatabaseTrendEvidence = { id: string; trend_id: string; source_name: string; title: string; url: string; published_at: string | null };
type DatabaseTrendAssessment = { trend_id: string; product_feature_id: string; status: "covered" | "gap" | "watch" | "pioneer"; rationale: string };
type Related<T> = T | T[] | null;
type DatabasePublisherFeatureObservation = { id: string; observed_feature: string; platforms: string[]; status: "current" | "historical" | "unclear"; evidence_url: string; evidence_label: string; evidence_quality: "direct" | "industry_report" | "to_verify"; observed_at: string; notes: string; sources: Related<{ name: string }>; product_features: Related<{ id: string; title: string }>; trend_signals: Related<{ id: string; title: string }> };
type DatabasePublisherWatchlistItem = { region: "dach" | "europe" | "north_america"; market: string; priority: number; sources: Related<{ id: string; name: string }> };
type DatabaseFeatureLabItem = { id: string; product_name: string; feature_description: string; reference_url: string; screenshot_url: string | null; copyability: "high" | "medium" | "low"; implementation_effort: "low" | "medium" | "high"; visibility: "clear" | "partial" | "unclear"; product_value: "high" | "medium" | "low"; build_priority: "now" | "watch" | "later"; status: "research" | "evaluate" | "build" | "done"; rationale: string; technical_notes: string; assignee: string; detected_tech: string[]; inspection_status: "pending" | "scanned" | "unavailable"; implementation_brief: string; created_at: string; sources: Related<{ name: string }>; trend_signals: Related<{ title: string }>; publisher_feature_observations: Related<{ observed_feature: string }> };
type DatabaseDiscoveryGroup = { id: string; feature_key: string; title: string; medium: "audio" | "video" | "both"; description: string; prototype_brief: string; publisher_feature_findings: Array<{ id: string; publisher_source_id: string; evidence_url: string; evidence_label: string; page_excerpt: string; platforms: string[]; region: "dach" | "europe" | "north_america"; evidence_quality: "direct" | "to_verify"; technical_signals: string[]; screenshot_url: string | null; first_seen_at: string; last_seen_at: string; sources: Related<{ name: string }> }> | null };
type DatabaseScanTarget = { id: string; publisher_source_id: string; url: string; target_type: "website" | "audio_hub" | "video_hub" | "help" | "app_store"; active: boolean; sources: Related<{ name: string }> };
type DatabaseWeeklyFeatureReview = { feature_group_id: string; week_start: string; status: "selected" | "dismissed" };

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
    format: item.format ?? "Best Practice", tags: item.tags ?? [], publishedAt: item.published_at ?? new Date().toISOString(), discoveredAt: item.discovered_at,
    status: label(item.status) as Case["status"], metrics: (item.performance_metrics ?? []).map(mapMetric),
    context: item.excerpt ?? "Noch nicht ergänzt.", action: item.summary ?? "Noch nicht ergänzt.", isNew: false,
    relevanceScore: item.relevance_score ?? 3, priority: item.priority === "review_now" ? "Sofort prüfen" : item.priority === "background" ? "Hintergrund" : "Beobachten", signalType: ({ product: "Produkt", feature: "Feature", trend: "Trend", case: "Case", analysis: "Analyse", report: "Report" } as const)[item.signal_type ?? "case"],
    region: ({ dach: "DACH", europe: "Europa", north_america: "Nordamerika", global: "Global" } as const)[item.region ?? (item.market === "dach" ? "dach" : "global")], categories: item.categories ?? [], subcategory: item.subcategory ?? undefined, affectedPlatforms: item.affected_platforms ?? [], publisherRelated: item.publisher_related ?? item.sector === "publisher", whyRelevant: item.why_relevant ?? item.summary ?? "", observationStatus: ({ read: "Lesen", watch: "Beobachten", test: "Testen", share: "Weitergeben" } as const)[item.observation_status ?? "watch"], examplesMentioned: item.examples_mentioned ?? item.sector === "publisher", aiRelevance: ({ low: "Niedrig", medium: "Mittel", high: "Hoch" } as const)[item.ai_relevance ?? "low"], audioRelevance: ({ low: "Niedrig", medium: "Mittel", high: "Hoch" } as const)[item.audio_relevance ?? "low"], videoRelevance: ({ low: "Niedrig", medium: "Mittel", high: "Hoch" } as const)[item.video_relevance ?? "low"],
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
  const qualityLabels = { direct: "Direkt belegt", industry_report: "Branchenquelle", to_verify: "Zu verifizieren" } as const;
  const source = Array.isArray(item.sources) ? item.sources[0] : item.sources;
  const productFeature = Array.isArray(item.product_features) ? item.product_features[0] : item.product_features;
  const trend = Array.isArray(item.trend_signals) ? item.trend_signals[0] : item.trend_signals;
  return { id: item.id, publisher: source?.name ?? "Unbekannter Publisher", observedFeature: item.observed_feature, platforms: item.platforms ?? [], status: labels[item.status], evidenceUrl: item.evidence_url, evidenceLabel: item.evidence_label, evidenceQuality: qualityLabels[item.evidence_quality], originTrendId: trend?.id ?? null, originTrendTitle: trend?.title ?? null, observedAt: item.observed_at, notes: item.notes ?? "", productFeatureId: productFeature?.id ?? null, productFeatureTitle: productFeature?.title ?? null };
}

function mapPublisherWatchlistItem(item: DatabasePublisherWatchlistItem): PublisherWatchlistItem | null {
  const source = Array.isArray(item.sources) ? item.sources[0] : item.sources;
  if (!source) return null;
  const regions = { dach: "DACH", europe: "Europa", north_america: "Nordamerika" } as const;
  return { sourceId: source.id, publisher: source.name, region: regions[item.region], market: item.market, priority: item.priority };
}

function mapFeatureLabItem(item: DatabaseFeatureLabItem): FeatureLabItem {
  const source = Array.isArray(item.sources) ? item.sources[0] : item.sources; const trend = Array.isArray(item.trend_signals) ? item.trend_signals[0] : item.trend_signals; const observation = Array.isArray(item.publisher_feature_observations) ? item.publisher_feature_observations[0] : item.publisher_feature_observations;
  const level = { high: "Hoch", medium: "Mittel", low: "Niedrig" } as const; const visibility = { clear: "Klar sichtbar", partial: "Teilweise sichtbar", unclear: "Unklar" } as const; const priority = { now: "Jetzt", watch: "Beobachten", later: "Später" } as const; const status = { research: "Recherche", evaluate: "Bewerten", build: "Nachbauen", done: "Erledigt" } as const;
  const inspection = { pending: "Ausstehend", scanned: "Geprüft", unavailable: "Nicht verfügbar" } as const;
  return { id: item.id, publisher: source?.name ?? "Unbekannter Publisher", productName: item.product_name, featureDescription: item.feature_description, referenceUrl: item.reference_url, screenshotUrl: item.screenshot_url, copyability: level[item.copyability], implementationEffort: level[item.implementation_effort], visibility: visibility[item.visibility], productValue: level[item.product_value], buildPriority: priority[item.build_priority], status: status[item.status], rationale: item.rationale, technicalNotes: item.technical_notes, trendTitle: trend?.title ?? null, observationTitle: observation?.observed_feature ?? null, assignee: item.assignee ?? "", detectedTech: item.detected_tech ?? [], inspectionStatus: inspection[item.inspection_status ?? "pending"], implementationBrief: item.implementation_brief ?? "", createdAt: item.created_at };
}

function mapDiscoveryGroup(item: DatabaseDiscoveryGroup): FeatureDiscoveryGroup {
  const findings: FeatureDiscoveryGroup["findings"] = (item.publisher_feature_findings ?? []).map((finding) => { const source = Array.isArray(finding.sources) ? finding.sources[0] : finding.sources; return { id: finding.id, publisher: source?.name ?? "Unbekannter Publisher", publisherId: finding.publisher_source_id, url: finding.evidence_url, label: finding.evidence_label, excerpt: finding.page_excerpt, platforms: finding.platforms ?? [], region: ({ dach: "DACH", europe: "Europa", north_america: "Nordamerika" } as const)[finding.region], evidenceQuality: (finding.evidence_quality === "direct" ? "Direkt belegt" : "Zu verifizieren") as "Direkt belegt" | "Zu verifizieren", technicalSignals: finding.technical_signals ?? [], screenshotUrl: finding.screenshot_url, firstSeenAt: finding.first_seen_at, lastSeenAt: finding.last_seen_at }; });
  const dates = findings.map((finding) => finding.firstSeenAt).sort(); const latest = findings.map((finding) => finding.lastSeenAt).sort().at(-1) ?? new Date().toISOString();
  return { id: item.id, key: item.feature_key, title: item.title, medium: item.medium === "both" ? "Audio & Video" : item.medium === "audio" ? "Audio" : "Video", description: item.description, prototypeBrief: item.prototype_brief, findings, firstSeenAt: dates[0] ?? latest, lastSeenAt: latest };
}

function mapScanTarget(item: DatabaseScanTarget): PublisherScanTargetOverview { const source = Array.isArray(item.sources) ? item.sources[0] : item.sources; const types = { website: "Website", audio_hub: "Audio-Hub", video_hub: "Video-Hub", help: "Hilfe", app_store: "App-Store" } as const; return { id: item.id, publisherSourceId: item.publisher_source_id, publisher: source?.name ?? "Unbekannter Publisher", url: item.url, targetType: types[item.target_type], active: item.active }; }

export async function getDashboardData() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { cases: [] as Case[], sourceNames: sourceFallback, sources: [] as SourceOverview[], features: featureFallback, trends: [] as TrendSignal[], publisherObservations: [] as PublisherFeatureObservation[], publisherWatchlist: [] as PublisherWatchlistItem[], featureLabItems: [] as FeatureLabItem[], discoveryGroups: [] as FeatureDiscoveryGroup[], scanTargets: [] as PublisherScanTargetOverview[], weeklyFeatureReviews: [] as WeeklyFeatureReview[], connected: false, loadError: false };
  try {
    const [casesResult, sourcesResult, runsResult, featuresResult, trendsResult, evidenceResult, assessmentsResult, publisherObservationsResult, publisherWatchlistResult, featureLabResult, discoveryResult, scanTargetsResult, weeklyReviewsResult] = await Promise.all([
      supabase.from("cases").select("*, sources(name), performance_metrics(kind,value_numeric,value_text,unit,period,evidence_url,evidence_label)").order("published_at", { ascending: false }),
      supabase.from("sources").select("id,name,homepage_url,feed_url,access,active,last_fetched_at").order("name"),
      supabase.from("ingestion_runs").select("source_id,status,started_at,error").order("started_at", { ascending: false }),
      supabase.from("product_features").select("id,title,area,status,surfaces,description").order("area").order("created_at"),
      supabase.from("trend_signals").select("id,title,summary,area,maturity,status,origin,observed_at").order("observed_at", { ascending: false }),
      supabase.from("trend_evidence").select("id,trend_id,source_name,title,url,published_at"),
      supabase.from("trend_feature_assessments").select("trend_id,product_feature_id,status,rationale"),
      supabase.from("publisher_feature_observations").select("id,observed_feature,platforms,status,evidence_url,evidence_label,evidence_quality,observed_at,notes,sources(name),product_features(id,title),trend_signals(id,title)").order("observed_at", { ascending: false }),
      supabase.from("publisher_watchlist").select("region,market,priority,sources(id,name)").order("region").order("priority"),
      supabase.from("feature_lab_items").select("id,product_name,feature_description,reference_url,screenshot_url,copyability,implementation_effort,visibility,product_value,build_priority,status,rationale,technical_notes,assignee,detected_tech,inspection_status,implementation_brief,created_at,sources(name),trend_signals(title),publisher_feature_observations(observed_feature)").order("created_at", { ascending: false }),
      supabase.from("publisher_feature_groups").select("id,feature_key,title,medium,description,prototype_brief,publisher_feature_findings(id,publisher_source_id,evidence_url,evidence_label,page_excerpt,platforms,region,evidence_quality,technical_signals,screenshot_url,first_seen_at,last_seen_at,sources(name))").order("updated_at", { ascending: false }),
      supabase.from("publisher_scan_targets").select("id,publisher_source_id,url,target_type,active,sources(name)").order("created_at"),
      supabase.from("weekly_feature_reviews").select("feature_group_id,week_start,status").order("week_start", { ascending: false }),
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
    const publisherWatchlist = publisherWatchlistResult.error ? [] : ((publisherWatchlistResult.data ?? []) as DatabasePublisherWatchlistItem[]).map(mapPublisherWatchlistItem).filter((item): item is PublisherWatchlistItem => item !== null);
    const featureLabItems = featureLabResult.error ? [] : ((featureLabResult.data ?? []) as DatabaseFeatureLabItem[]).map(mapFeatureLabItem);
    const discoveryGroups = discoveryResult.error ? [] : ((discoveryResult.data ?? []) as DatabaseDiscoveryGroup[]).map(mapDiscoveryGroup);
    const scanTargets = scanTargetsResult.error ? [] : ((scanTargetsResult.data ?? []) as DatabaseScanTarget[]).map(mapScanTarget);
    const weeklyFeatureReviews = weeklyReviewsResult.error ? [] : ((weeklyReviewsResult.data ?? []) as DatabaseWeeklyFeatureReview[]).map((item) => ({ groupId: item.feature_group_id, weekStart: item.week_start, status: item.status === "selected" ? "Ausgewählt" : "Ausgeblendet" }));
    return { cases: ((casesResult.data ?? []) as DatabaseCase[]).map(mapCase), sourceNames: ["Alle Quellen", ...sources.filter((source) => source.active).map((source) => source.name)], sources, features: features.length ? features : featureFallback, trends, publisherObservations, publisherWatchlist, featureLabItems, discoveryGroups, scanTargets, weeklyFeatureReviews, connected: true, loadError: false };
  } catch (error) {
    console.error("Media Pulse database load failed:", error);
    return { cases: [] as Case[], sourceNames: sourceFallback, sources: [] as SourceOverview[], features: featureFallback, trends: [] as TrendSignal[], publisherObservations: [] as PublisherFeatureObservation[], publisherWatchlist: [] as PublisherWatchlistItem[], featureLabItems: [] as FeatureLabItem[], discoveryGroups: [] as FeatureDiscoveryGroup[], scanTargets: [] as PublisherScanTargetOverview[], weeklyFeatureReviews: [] as WeeklyFeatureReview[], connected: false, loadError: true };
  }
}
