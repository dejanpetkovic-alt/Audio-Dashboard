"use client";

import type { Case } from "@/lib/types";

export default function ExecutiveMetrics({ cases }: { cases: Case[] }) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const recent = cases.filter((item) => new Date(item.discoveredAt ?? item.publishedAt).valueOf() >= since);
  const metrics = [
    [recent.length, "neue Signale"],
    [recent.filter((item) => (item.relevanceScore ?? 3) >= 4).length, "sofort prüfen"],
    [recent.filter((item) => item.medium === "Audio").length, "Audio-Signale"],
    [recent.filter((item) => item.tags.some((tag) => tag.toLowerCase() === "ki")).length, "KI-Signale"],
    [recent.filter((item) => item.sector === "Publisher").length, "Publisher-Cases"],
  ] as const;
  return <section className="executive-metrics"><p className="eyebrow">EXECUTIVE LAGEBILD · LETZTE 24 STUNDEN</p><div>{metrics.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div></section>;
}
