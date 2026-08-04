"use client";

import type { Case } from "@/lib/types";

type Topic = { title: string; description: string; matches: (item: Case) => boolean };

const topics: Topic[] = [
  { title: "Audio & Podcast", description: "Neue Audioformate, Podcasts und Audio-Produkte.", matches: (item) => item.medium === "Audio" },
  { title: "Video & Videopodcast", description: "Bewegtbild, Kurzvideo und Video-Podcast-Formate.", matches: (item) => item.medium === "Video" },
  { title: "KI im Publishing", description: "Automatisierung, synthetisches Audio und Personalisierung.", matches: (item) => item.tags.some((tag) => tag.toLowerCase() === "ki") },
  { title: "Plattform-Updates", description: "Änderungen bei Spotify, YouTube, Meta, Google und weiteren Plattformen.", matches: (item) => item.tags.some((tag) => tag.toLowerCase() === "plattform") },
  { title: "Publisher Cases", description: "Neue Produkte, Experimente und Best Practices von Medienhäusern.", matches: (item) => item.sector === "Publisher" },
  { title: "DACH-Fokus", description: "Übertragbare Entwicklungen aus Deutschland, Österreich und der Schweiz.", matches: (item) => item.market === "DACH" },
];

export default function TopicHub({ cases, onOpen }: { cases: Case[]; onOpen: (item: Case) => void }) {
  const published = cases.filter((item) => item.status === "Freigegeben");
  return <section className="topic-hub"><div className="topic-heading"><div><p className="eyebrow">THEMENBEREICHE</p><h2>Gezielt durch die <em>Entwicklungen</em></h2></div><p>Jeder Bereich bündelt die jüngsten freigegebenen Cases.</p></div><div className="topic-grid">{topics.map((topic) => { const hits = published.filter(topic.matches).slice(0, 3); return <article key={topic.title}><header><span>{hits.length}</span><b>{topic.title}</b></header><p>{topic.description}</p>{hits.length ? <div>{hits.map((item) => <button key={item.id} onClick={() => onOpen(item)}>{item.title}</button>)}</div> : <small>Noch keine passenden Cases.</small>}</article>; })}</div></section>;
}
