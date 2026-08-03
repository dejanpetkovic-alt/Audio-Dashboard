import { getSupabaseAdmin } from "./supabase";

type ImportedCase = { title: string; excerpt: string | null; canonical_url: string; published_at: string | null; sources: { name: string }[] | null };
type TrendRule = { title: string; summary: string; area: "audio" | "video" | "both"; maturity: "early_signal" | "growing" | "standard"; patterns: RegExp[]; featureTitles: string[] };

// These intentionally narrow rules create editorial drafts, not published claims.
// A semantic/AI layer can be added later when an API key is available.
const rules: TrendRule[] = [
  { title: "KI-generierte Audio-Briefings und News-Podcasts", summary: "Fundstellen zu KI-gestützten Audio-Briefings, automatisierten News-Podcasts oder vergleichbaren Formaten.", area: "audio", maturity: "early_signal", patterns: [/\b(ai|artificial intelligence|generative ai|ki[- ]generiert|automation)\b/i, /\b(audio|podcast|briefing|news report|daily report|voice)\b/i], featureTitles: ["KI-generierte Morgenreports", "KI-generierte Themenreports"] },
  { title: "Artikelvertonung und Text-to-Speech", summary: "Fundstellen zu vertonten Artikeln, Text-to-Speech oder narrativen Lesemodi.", area: "audio", maturity: "growing", patterns: [/\b(text[- ]to[- ]speech|tts|article narration|article audio|listen to this article|vertont)\b/i], featureTitles: ["Artikelvertonung in den Apps"] },
  { title: "Vertikale Videoformate und Kurzvideo-Feeds", summary: "Fundstellen zu Reels, Shorts, TikTok, vertikalem Video oder Kurzvideo-Feeds.", area: "video", maturity: "growing", patterns: [/\b(reels?|shorts?|tiktok|vertical video|vertical feed|short[- ]form video)\b/i], featureTitles: ["Vertical-Feed-Player", "Video-Player im Artikel"] },
  { title: "Video-Podcasts und Bewegtbild im Audio-Angebot", summary: "Fundstellen zu Video-Podcasts oder der Verbindung von Audio- und Videoformaten.", area: "both", maturity: "early_signal", patterns: [/\b(video podcast|podcast video|video podcasts)\b/i], featureTitles: ["Redaktionelle Podcasts", "Video-Player im Artikel"] },
  { title: "Personalisierte Audio- und Video-Erlebnisse", summary: "Fundstellen zu personalisierten Empfehlungen, individuellen Briefings oder personalisierten Medienformaten.", area: "both", maturity: "early_signal", patterns: [/\b(personali[sz](ed|ation|ierte?)|personalised|customi[sz](ed|ation)|tailored)\b/i, /\b(audio|podcast|video|briefing|feed)\b/i], featureTitles: ["KI-generierte Morgenreports", "KI-generierte Themenreports", "Vertical-Feed-Player"] },
];

function matches(rule: TrendRule, item: ImportedCase) { const text = `${item.title} ${item.excerpt ?? ""}`; return rule.patterns.every((pattern) => pattern.test(text)); }

export async function generateTrendDrafts() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const { data: cases, error: casesError } = await supabase.from("cases").select("title,excerpt,canonical_url,published_at,sources(name)").in("status", ["review", "published"]).gte("discovered_at", since).order("discovered_at", { ascending: false }).limit(250);
  if (casesError) throw new Error(casesError.message);
  const { data: trends, error: trendsError } = await supabase.from("trend_signals").select("id,title");
  if (trendsError) throw new Error(trendsError.message);
  const { data: evidence, error: evidenceError } = await supabase.from("trend_evidence").select("trend_id,url");
  if (evidenceError) throw new Error(evidenceError.message);
  const { data: features, error: featuresError } = await supabase.from("product_features").select("id,title");
  if (featuresError) throw new Error(featuresError.message);
  const existing = new Map((trends ?? []).map((trend) => [trend.title, trend.id]));
  const knownEvidence = new Set((evidence ?? []).map((item) => `${item.trend_id}:${item.url}`));
  const result: Array<{ title: string; evidenceAdded: number }> = [];
  for (const rule of rules) {
    const hits = ((cases ?? []) as ImportedCase[]).filter((item) => matches(rule, item));
    if (!hits.length) continue;
    let trendId = existing.get(rule.title);
    if (!trendId) {
      const { data, error } = await supabase.from("trend_signals").insert({ title: rule.title, summary: rule.summary, area: rule.area, maturity: rule.maturity, status: "published", origin: "automation" }).select("id").single();
      if (error) throw new Error(error.message);
      trendId = data.id; existing.set(rule.title, trendId);
    }
    const newEvidence = hits.filter((item) => !knownEvidence.has(`${trendId}:${item.canonical_url}`)).map((item) => ({ trend_id: trendId, source_name: item.sources?.[0]?.name ?? "Unbekannte Quelle", title: item.title, url: item.canonical_url, published_at: item.published_at }));
    if (newEvidence.length) {
      const { error } = await supabase.from("trend_evidence").insert(newEvidence);
      if (error) throw new Error(error.message);
      newEvidence.forEach((item) => knownEvidence.add(`${trendId}:${item.url}`));
    }
    const matchingFeatures = (features ?? []).filter((feature) => rule.featureTitles.includes(feature.title));
    if (matchingFeatures.length) {
      const { error } = await supabase.from("trend_feature_assessments").upsert(matchingFeatures.map((feature) => ({ trend_id: trendId, product_feature_id: feature.id, status: "watch", rationale: "Automatisch anhand der Trendthematik zugeordnet." })), { onConflict: "trend_id,product_feature_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    result.push({ title: rule.title, evidenceAdded: newEvidence.length });
  }
  return result;
}
