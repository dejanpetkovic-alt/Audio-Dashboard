import { XMLParser } from "fast-xml-parser";
import { getSupabaseAdmin } from "./supabase";
import { generateTrendDrafts } from "./trend-automation";
import { inferCaseIntelligence } from "./case-intelligence";
import { runPublisherFeatureDiscovery } from "./feature-discovery";

type Source = { id: string; name: string; feed_url: string | null };
type FeedItem = { title?: unknown; link?: unknown; guid?: unknown; pubDate?: unknown; published?: unknown; description?: unknown; "content:encoded"?: unknown };
type SourceRule = { medium?: "audio" | "video"; sector?: "publisher" | "other_industry"; tags?: string[] };

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: false, trimValues: true });
const text = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const shorten = (value: string, length = 420) => value.length > length ? `${value.slice(0, length - 1).trimEnd()}…` : value;
const audioPattern = /\b(audio|podcast|voice|listen(?:ing)?|sonic|spoken word|hör(?:en|spiel|buch)?|sprachassistent)\b/i;
const videoPattern = /\b(video|youtube|tiktok|reel|shorts|livestream|streaming|visual journalism|vertical)\b/i;
const otherIndustryPattern = /\b(brand|retail|commerce|marketing|agency|fitness|health|travel|bank|automotive|consumer)\b/i;

// Defaults are only set for sources whose editorial focus is unambiguous.
// They prevent platform cases from being sorted into the publisher area.
const sourceRules: Record<string, SourceRule> = {
  "YouTube Official Blog": { medium: "video", sector: "other_industry", tags: ["YouTube", "Videoplattform"] },
  "Podnews": { medium: "audio", sector: "publisher", tags: ["Podcasting", "Audio-Branche"] },
  "Spotify Newsroom": { sector: "other_industry", tags: ["Spotify", "Streaming"] },
  "Meta Newsroom": { sector: "other_industry", tags: ["Meta", "Plattform"] },
  "Google Search Central Blog": { sector: "other_industry", tags: ["Google", "Discoverability"] },
  "Netflix TechBlog": { sector: "other_industry", tags: ["Netflix", "Streaming-Produkt"] },
};

function classify(title: string, body: string, sourceName: string) {
  const document = `${title} ${body}`;
  const rule = sourceRules[sourceName];
  const medium = videoPattern.test(document) ? "video" : audioPattern.test(document) ? "audio" : rule?.medium ?? null;
  if (!medium) return null;
  return {
    medium,
    sector: rule?.sector ?? (otherIndustryPattern.test(document) && !/nieman|inma|wan-ifra/i.test(sourceName) ? "other_industry" : "publisher"),
    market: /\b(german|germany|dach|deutsch|schweiz|austria|österreich)\b/i.test(document) ? "dach" : "international",
    platform: /\b(app|mobile)\b/i.test(document) ? "app" : /\b(web|website|site)\b/i.test(document) ? "web" : "web_and_app",
    tags: rule?.tags ?? [],
  };
}

function feedItems(xml: string): FeedItem[] {
  const parsed = parser.parse(xml);
  const raw = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  return Array.isArray(raw) ? raw : [raw];
}

function itemUrl(item: FeedItem) {
  if (typeof item.link === "string") return item.link;
  if (item.link && typeof item.link === "object") {
    const links = Array.isArray(item.link) ? item.link : [item.link];
    const first = links.find((link) => typeof link === "object" && link !== null && "@_href" in link) as Record<string, unknown> | undefined;
    return typeof first?.["@_href"] === "string" ? first["@_href"] : undefined;
  }
  return text(item.guid);
}

export async function runIngestion() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: sources, error } = await supabase.from("sources").select("id,name,feed_url").eq("active", true).not("feed_url", "is", null);
  if (error) throw new Error(error.message);
  const results: Array<{ source: string; imported: number; error?: string }> = [];

  for (const source of (sources ?? []) as Source[]) {
    const { data: run } = await supabase.from("ingestion_runs").insert({ source_id: source.id }).select("id").single();
    try {
      const response = await fetch(source.feed_url!, { headers: { "user-agent": "MediaPulseBot/1.0 (+internal research dashboard)" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Feed returned ${response.status}`);
      const candidates = feedItems(await response.text()).slice(0, 30).flatMap((item) => {
        const title = text(item.title); const excerpt = shorten(text(item.description || item["content:encoded"])); const url = itemUrl(item);
        const classification = classify(title, excerpt, source.name);
        if (!title || !url || !classification) return [];
        const parsedDate = new Date(text(item.pubDate || item.published));
        const intelligence = inferCaseIntelligence(title, excerpt, classification.sector, source.name, classification.tags);
        return [{ source_id: source.id, canonical_url: url, external_id: text(item.guid) || null, title, excerpt, summary: excerpt, ...classification, tags: intelligence.tags, relevance_score: intelligence.relevanceScore, priority: intelligence.priority, signal_type: intelligence.signalType, region: classification.market === "dach" ? "dach" : "global", categories: intelligence.categories, subcategory: intelligence.subcategory, affected_platforms: intelligence.affectedPlatforms, publisher_related: intelligence.publisherRelated, why_relevant: intelligence.whyRelevant, observation_status: intelligence.observationStatus, examples_mentioned: intelligence.examplesMentioned, ai_relevance: intelligence.aiRelevance, audio_relevance: intelligence.audioRelevance, video_relevance: intelligence.videoRelevance, format: "Artikel", published_at: Number.isNaN(parsedDate.valueOf()) ? null : parsedDate.toISOString(), status: "review" }];
      });
      const { error: insertError } = await supabase.from("cases").upsert(candidates, { onConflict: "canonical_url", ignoreDuplicates: true });
      if (insertError) throw new Error(insertError.message);
      if (run) await supabase.from("ingestion_runs").update({ status: "completed", finished_at: new Date().toISOString(), imported_count: candidates.length }).eq("id", run.id);
      await supabase.from("sources").update({ last_fetched_at: new Date().toISOString() }).eq("id", source.id);
      results.push({ source: source.name, imported: candidates.length });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown ingestion error";
      if (run) await supabase.from("ingestion_runs").update({ status: "failed", finished_at: new Date().toISOString(), error: message }).eq("id", run.id);
      results.push({ source: source.name, imported: 0, error: message });
    }
  }
  try { await generateTrendDrafts(); } catch (cause) { console.error("Trend automation failed:", cause); }
  try { await runPublisherFeatureDiscovery(); } catch (cause) { console.error("Publisher feature discovery failed:", cause); }
  return results;
}
