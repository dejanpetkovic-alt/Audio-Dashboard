export type CaseIntelligence = { relevanceScore: number; priority: "review_now" | "watch" | "background"; signalType: "product" | "feature" | "trend" | "case" | "analysis" | "report"; tags: string[]; categories: string[]; subcategory: string; affectedPlatforms: string[]; publisherRelated: boolean; whyRelevant: string; observationStatus: "read" | "watch" | "test" | "share"; examplesMentioned: boolean; aiRelevance: "low" | "medium" | "high"; audioRelevance: "low" | "medium" | "high"; videoRelevance: "low" | "medium" | "high" };

const patterns = {
  ai: /\b(ai|artificial intelligence|generative ai|llm|machine learning|ki[- ]generiert|künstliche intelligenz)\b/i,
  platform: /\b(spotify|youtube|meta|tiktok|apple podcasts?|google|linkedin|openai|perplexity)\b/i,
  monetization: /\b(monetiz|revenue|subscription|subscriber|paywall|abo|advertis|werbung|sponsor)\b/i,
  feature: /\b(launch|introduc|new feature|rollout|testet|startet|führt .* ein|funktion|player|tool)\b/i,
  report: /\b(report|study|survey|analyse|research)\b/i,
};

export function inferCaseIntelligence(title: string, excerpt: string, sector: "publisher" | "other_industry", sourceName: string, currentTags: string[] = []): CaseIntelligence {
  const document = `${title} ${excerpt} ${sourceName}`;
  const tags = [...currentTags];
  const add = (tag: string) => { if (!tags.some((item) => item.toLowerCase() === tag.toLowerCase())) tags.push(tag); };
  if (patterns.ai.test(document)) add("KI");
  if (patterns.platform.test(document)) add("Plattform");
  if (patterns.monetization.test(document)) add("Monetarisierung");
  let relevanceScore = sector === "publisher" ? 3 : 2;
  if (patterns.ai.test(document)) relevanceScore += 1;
  if (patterns.platform.test(document)) relevanceScore += 1;
  if (patterns.monetization.test(document)) relevanceScore += 1;
  relevanceScore = Math.min(relevanceScore, 5);
  const priority = relevanceScore >= 4 ? "review_now" : relevanceScore === 3 ? "watch" : "background";
  const signalType = patterns.report.test(document) ? "report" : patterns.feature.test(document) ? "feature" : sector === "publisher" ? "case" : patterns.platform.test(document) ? "product" : "analysis";
  const categories = [/\b(audio|podcast|voice|listen)\b/i.test(document) ? "Audio" : "Video", sector === "publisher" ? "Publisher" : "Andere Branche", ...tags.filter((tag) => ["KI", "Plattform", "Monetarisierung"].includes(tag))];
  const affectedPlatforms = ["Spotify", "YouTube", "Meta", "TikTok", "Apple Podcasts", "Google", "LinkedIn", "OpenAI", "Perplexity"].filter((name) => new RegExp(name.replace(" ", "\\s+"), "i").test(document));
  const aiRelevance = patterns.ai.test(document) ? "high" : "low";
  const audioRelevance = /\b(audio|podcast|voice|listen)\b/i.test(document) ? "high" : "low";
  const videoRelevance = /\b(video|youtube|tiktok|reel|shorts)\b/i.test(document) ? "high" : "low";
  const subcategory = audioRelevance === "high" ? "Audio / Podcast" : videoRelevance === "high" ? "Video / Videopodcast" : signalType;
  const whyRelevant = `Relevanzscore ${relevanceScore}/5: ${categories.join(", ")} mit ${priority === "review_now" ? "unmittelbarem Prüfbedarf" : "Beobachtungsbedarf"}.`;
  return { relevanceScore, priority, signalType, tags, categories, subcategory, affectedPlatforms, publisherRelated: sector === "publisher", whyRelevant, observationStatus: priority === "review_now" ? "test" : "watch", examplesMentioned: sector === "publisher", aiRelevance, audioRelevance, videoRelevance };
}
