"use client";

import { useMemo, useState } from "react";
import type { Case } from "@/lib/types";

const topics = ["KI", "Plattform", "Monetarisierung", "Audio", "Video", "Publisher"] as const;
const dateFor = (item: Case) => new Date(item.discoveredAt ?? item.publishedAt).valueOf();
function includesTopic(item: Case, topic: string) { return topic === "Audio" ? item.medium === "Audio" : topic === "Video" ? item.medium === "Video" : topic === "Publisher" ? item.sector === "Publisher" : item.tags.some((tag) => tag.toLowerCase() === topic.toLowerCase()); }

export default function TrendTimeline({ cases }: { cases: Case[] }) {
  const [days, setDays] = useState<7 | 30>(7);
  const rows = useMemo(() => { const now = Date.now(); const span = days * 24 * 60 * 60 * 1000; const current = cases.filter((item) => dateFor(item) >= now - span); const previous = cases.filter((item) => dateFor(item) >= now - span * 2 && dateFor(item) < now - span); return topics.map((topic) => ({ topic, count: current.filter((item) => includesTopic(item, topic)).length, previous: previous.filter((item) => includesTopic(item, topic)).length })).filter((item) => item.count || item.previous).sort((a, b) => b.count - a.count).slice(0, 6); }, [cases, days]);
  const max = Math.max(...rows.map((item) => item.count), 1);
  return <section className="trend-timeline"><div className="timeline-heading"><div><p className="eyebrow">TRENDS ÜBER ZEIT</p><h2>Welche Themen gewinnen an <em>Dynamik?</em></h2></div><div><button className={days === 7 ? "selected" : ""} onClick={() => setDays(7)}>7 Tage</button><button className={days === 30 ? "selected" : ""} onClick={() => setDays(30)}>30 Tage</button></div></div>{rows.length ? <div className="timeline-rows">{rows.map((item) => { const delta = item.count - item.previous; return <div key={item.topic}><strong>{item.topic}</strong><span><i style={{ width: `${Math.max(8, item.count / max * 100)}%` }} /></span><b>{item.count}</b><small className={delta > 0 ? "up" : delta < 0 ? "down" : "flat"}>{delta > 0 ? `+${delta}` : delta} ggü. Vorperiode</small></div>)}</div> : <div className="timeline-empty">Noch zu wenig Daten im ausgewählten Zeitraum. Nach weiteren Imports werden hier Themenhäufungen sichtbar.</div>}</section>;
}
