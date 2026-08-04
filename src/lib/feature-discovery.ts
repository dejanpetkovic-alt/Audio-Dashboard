import { screenshotUrl } from "./screenshot";
import { getSupabaseAdmin } from "./supabase";

type ScanTarget = { id: string; publisher_source_id: string; url: string; target_type: "website" | "audio_hub" | "video_hub" | "help" | "app_store"; sources: { name: string; homepage_url: string } | null };
type Definition = { key: string; title: string; medium: "audio" | "video" | "both"; description: string; brief: string; patterns: RegExp[]; platforms: string[] };

const definitions: Definition[] = [
  { key: "article-tts", title: "Artikel vorlesen / Text-to-Speech", medium: "audio", description: "Eine Vorlesefunktion macht Artikel als Audio direkt am Lesepunkt verfügbar.", brief: "Erstelle einen klickbaren Web-Prototyp einer Artikel-Vorlesefunktion. Zeige einen Artikelkopf mit gut sichtbarem „Artikel anhören“-Einstieg, einen kompakten Player mit Abspielstatus, Geschwindigkeit und Fortschritt sowie eine Rückkehr zum Lesetext. Nutze Platzhalterinhalte und kopiere weder Gestaltung noch Inhalte der Referenz.", patterns: [/(text[- ]to[- ]speech|vorlesefunktion|artikel anhören|listen to this article|article audio|article narration)/i], platforms: ["Web", "App"] },
  { key: "podcast-hub", title: "Podcast- und Audio-Hub", medium: "audio", description: "Ein zentraler Bereich bündelt Podcast- und Audioformate zur Entdeckung und Wiedergabe.", brief: "Erstelle einen klickbaren Web-Prototyp eines Audio-Hubs für eine Nachrichtenmarke. Enthalten sein sollen Einstieg, Format-Kategorien, Episodenkarten, ein persistenter Mini-Player und eine Detailansicht. Nutze fiktive Marken- und Inhaltsdaten.", patterns: [/(podcast|audio hub|audioangebote|audio-angebote|audiothek)/i], platforms: ["Web", "App"] },
  { key: "article-video", title: "Video-Player im redaktionellen Angebot", medium: "video", description: "Video wird als eigenständiges redaktionelles Element in Artikeln oder Themenbereichen angeboten.", brief: "Erstelle einen klickbaren Web-Prototyp eines Artikel-Video-Moduls. Baue Artikelkontext, Videoplayer-Platzhalter, Titel, Laufzeit, Untertitel-Schalter und Empfehlungen unterhalb des Players. Verwende keine Inhalte oder Gestaltung der Referenz.", patterns: [/(<video\b|jwplayer|jw-player|brightcove|theoplayer|video player|videoplayer)/i], platforms: ["Web", "App"] },
  { key: "vertical-video", title: "Vertical-Video-Feed", medium: "video", description: "Vertikale Kurzvideos werden als swipe- oder feedartiges Entdeckungsformat präsentiert.", brief: "Erstelle einen klickbaren Web-Prototyp eines Vertical-Video-Feeds für eine Nachrichten-App im Web. Zeige ein Vollformat-Video-Layout, Swipe-/Weiter-Navigation, Kontext, Tonsteuerung und eine Aktion zum Öffnen des zugehörigen Artikels. Verwende fiktive Daten.", patterns: [/(vertical video|vertical feed|reels?|shorts?|tiktok)/i], platforms: ["Web", "App"] },
  { key: "captions", title: "Untertitel und barrierearmes Video", medium: "video", description: "Videoangebote enthalten sichtbare Untertitel- oder Caption-Signale für verständliche Wiedergabe ohne Ton.", brief: "Erstelle einen klickbaren Web-Prototyp eines barrierearmen Nachrichten-Video-Moduls mit Untertitel-Schalter, sichtbarem Transcript-Ausschnitt, Tonsteuerung und klaren Player-Zuständen. Nutze fiktive Inhalte und eine eigenständige Gestaltung.", patterns: [/(untertitel|captions|subtitles|transcript)/i], platforms: ["Web", "App"] },
];

const strip = (value: string) => value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const titleOf = (html: string) => /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.replace(/<[^>]+>/g, "").trim() || "Öffentliche Publisher-Seite";
const childLinks = (html: string, base: string) => [...html.matchAll(/href=["']([^"'#?][^"']*)["']/gi)].map((match) => { try { return new URL(match[1], base); } catch { return null; } }).filter((url): url is URL => Boolean(url)).filter((url) => url.origin === new URL(base).origin && /(audio|podcast|video|reel|short|hilfe|help|app|epaper)/i.test(url.pathname)).slice(0, 1).map((url) => url.toString());

async function fetchPage(url: string) { const response = await fetch(url, { headers: { "user-agent": "MediaPulseFeatureDiscovery/1.0" }, signal: AbortSignal.timeout(5000), cache: "no-store" }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.text(); }

export async function runPublisherFeatureDiscovery() {
  const supabase = getSupabaseAdmin(); if (!supabase) return { scanned: 0, findings: 0 };
  const { data, error } = await supabase.from("publisher_scan_targets").select("id,publisher_source_id,url,target_type,sources(name,homepage_url)").eq("active", true).limit(45);
  if (error) throw new Error(error.message);
  const targets = (data ?? []) as unknown as ScanTarget[];
  const groupsResult = await supabase.from("publisher_feature_groups").select("id,feature_key"); if (groupsResult.error) throw new Error(groupsResult.error.message);
  const groups = new Map((groupsResult.data ?? []).map((group) => [group.feature_key, group.id]));
  const watchlistResult = await supabase.from("publisher_watchlist").select("publisher_source_id,region"); if (watchlistResult.error) throw new Error(watchlistResult.error.message);
  const regions = new Map((watchlistResult.data ?? []).map((item) => [item.publisher_source_id, item.region]));
  let findingCount = 0;
  await Promise.all(targets.map(async (target) => {
    try {
      const homepage = await fetchPage(target.url); const pages = [{ url: target.url, html: homepage }, ...(await Promise.all(childLinks(homepage, target.url).map(async (url) => ({ url, html: await fetchPage(url) }))))];
      for (const page of pages) {
        const excerpt = strip(page.html).slice(0, 550); const signals = definitions.filter((definition) => definition.patterns.some((pattern) => pattern.test(page.html)));
        for (const definition of signals) {
          let groupId = groups.get(definition.key);
          if (!groupId) { const created = await supabase.from("publisher_feature_groups").insert({ feature_key: definition.key, title: definition.title, medium: definition.medium, description: definition.description, prototype_brief: definition.brief }).select("id").single(); if (created.error) continue; groupId = created.data.id; groups.set(definition.key, groupId); }
          const technicalSignals = definition.patterns.filter((pattern) => pattern.test(page.html)).map((pattern) => pattern.source).slice(0, 3);
          const direct = definition.key === "article-video" ? /<video\b|jwplayer|brightcove|theoplayer/i.test(page.html) : definition.key === "article-tts";
          const { error: upsertError } = await supabase.from("publisher_feature_findings").upsert({ feature_group_id: groupId, publisher_source_id: target.publisher_source_id, scan_target_id: target.id, evidence_url: page.url, evidence_label: titleOf(page.html), page_excerpt: excerpt, platforms: target.target_type === "app_store" ? ["App"] : definition.platforms, region: regions.get(target.publisher_source_id) ?? "europe", evidence_quality: direct ? "direct" : "to_verify", technical_signals: technicalSignals, screenshot_url: screenshotUrl(page.url), last_seen_at: new Date().toISOString() }, { onConflict: "feature_group_id,publisher_source_id,evidence_url" });
          if (!upsertError) findingCount++;
        }
      }
    } catch (error) { console.info("Feature discovery skipped target", target.url, error instanceof Error ? error.message : "unknown error"); }
  }));
  return { scanned: targets.length, findings: findingCount };
}
