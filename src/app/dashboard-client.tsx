"use client";

import { type FormEvent, useMemo, useState } from "react";
import type { Case, Medium, Sector } from "@/lib/types";
import type { SourceOverview } from "@/lib/dashboard-data";

const mediumOptions: ("Alle" | Medium)[] = ["Alle", "Audio", "Video"];
const sectorOptions: ("Alle" | Sector)[] = ["Alle", "Publisher", "Andere Branchen"];

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "audio" | "video" | "new" | "neutral" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function CaseCard({ item, saved, onSave, onOpen }: { item: Case; saved: boolean; onSave: (id: string) => void; onOpen: (item: Case) => void }) {
  return <article className="case-card">
    <div className="card-topline"><span className="source">{item.source}</span><span className="date">{new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(new Date(item.publishedAt))}</span></div>
    <div className="badges"><Badge tone={item.medium === "Audio" ? "audio" : "video"}>{item.medium}</Badge><Badge>{item.sector}</Badge>{item.isNew && <Badge tone="new">Neu</Badge>}</div>
    <h3>{item.title}</h3><p>{item.summary}</p>
    <div className="tag-row">{item.tags.slice(0, 2).map(tag => <span key={tag}>#{tag}</span>)}</div>
    <div className="card-actions"><button className="text-button" onClick={() => onOpen(item)}>Case ansehen <span>→</span></button><button className={`save-button ${saved ? "saved" : ""}`} aria-label="Case speichern" onClick={() => onSave(item.id)}>{saved ? "★ Gespeichert" : "☆ Merken"}</button></div>
  </article>;
}

export default function Dashboard({ initialCases, sourceNames, sources, connected, loadError }: { initialCases: Case[]; sourceNames: string[]; sources: SourceOverview[]; connected: boolean; loadError: boolean }) {
  const [medium, setMedium] = useState<"Alle" | Medium>("Alle");
  const [sector, setSector] = useState<"Alle" | Sector>("Alle");
  const [source, setSource] = useState("Alle Quellen");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [view, setView] = useState<"dashboard" | "review" | "sources">("dashboard");
  const filtered = useMemo(() => initialCases.filter(item =>
    (medium === "Alle" || item.medium === medium) && (sector === "Alle" || item.sector === sector) &&
    (source === "Alle Quellen" || item.source === source) && `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  ), [initialCases, medium, sector, source, query]);
  const approved = filtered.filter(item => item.status === "Freigegeben" || approvedIds.includes(item.id));
  const toggleSaved = (id: string) => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return <main>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M</div><span>media<span>pulse</span></span></div>
      <nav><button className={view === "dashboard" ? "nav-active" : ""} onClick={() => setView("dashboard")}><span>▦</span> Dashboard</button><button><span>⌕</span> Entdecken</button><button><span>☆</span> Meine Merkliste <em>{saved.length}</em></button></nav>
      <div className="nav-section"><p>REDAKTION</p><button className={view === "review" ? "nav-active" : ""} onClick={() => setView("review")}><span>✓</span> Review-Queue <em>1</em></button><button className={view === "sources" ? "nav-active" : ""} onClick={() => setView("sources")}><span>◉</span> Quellen</button></div>
      <div className="profile"><div className="avatar">DP</div><div><strong>Daniel Petkovic</strong><small>Redaktion</small></div><span>⌄</span></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cases, Themen oder Quellen durchsuchen…" /></div><div className="header-actions"><button className="icon-button">◌</button><button className="notification">♧<i>3</i></button><span className="avatar small">DP</span></div></header>
      {view === "dashboard" && <>
        <section className="intro"><div><p className="eyebrow">AUDIO & VIDEO INTELLIGENCE</p><h1>Was bewegt Medienformate <em>jetzt?</em></h1><p className="intro-copy">Kuratiertes Wissen für digitale Produkte und Redaktionen. Aktuell, belegt und direkt anwendbar.</p></div><div className="sync"><span className="pulse-dot"/> Aktualisiert heute, 06:00<br/><small>12 neue Cases seit Ihrem letzten Besuch</small></div></section>
        <section className="filterbar"><div className="filter-group"><span>FORMAT</span>{mediumOptions.map(option => <button key={option} onClick={() => setMedium(option)} className={medium === option ? "selected" : ""}>{option}</button>)}</div><div className="divider"/><div className="filter-group"><span>BRANCHE</span>{sectorOptions.map(option => <button key={option} onClick={() => setSector(option)} className={sector === option ? "selected" : ""}>{option}</button>)}</div><select value={source} onChange={e => setSource(e.target.value)} aria-label="Quelle filtern">{sourceNames.map(name => <option key={name}>{name}</option>)}</select></section>
        <section className="kpi-strip"><div><strong>{approved.length}</strong><span>freigegebene Cases</span></div><div><strong>{initialCases.filter(item => item.isNew).length}</strong><span>neu seit Ihrem Besuch</span></div><div><strong>{Math.max(sourceNames.length - 1, 0)}</strong><span>aktive Quellen</span></div><button onClick={() => setView("review")}>Review-Queue öffnen <span>→</span></button></section>
        <section className="section-heading"><div><p className="eyebrow">AKTUELL & RELEVANT</p><h2>Neue Best Practices</h2></div><button className="text-button">Alle Cases <span>→</span></button></section>
        <section className="case-grid">{approved.length ? approved.map(item => <CaseCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={toggleSaved} onOpen={setActiveCase}/>) : <div className="empty-state"><strong>{connected ? "Noch keine Cases freigegeben." : loadError ? "Die Datenbankverbindung benötigt noch Aufmerksamkeit." : "Supabase ist noch nicht verbunden."}</strong><span>{connected ? "Der erste Import legt neue Fundstellen zunächst in der Review-Queue ab." : loadError ? "Die Details stehen sicher im Vercel Runtime Log." : "Bitte die Umgebungsvariablen in Vercel prüfen."}</span></div>}</section>
        <section className="category-section"><div className="section-heading"><div><p className="eyebrow">SCHNELLZUGRIFF</p><h2>Nach Bereich entdecken</h2></div></div><div className="category-grid">{[["🎙", "Audio bei Publishern", "Podcasts, Briefings & Sprachprodukte", "Audio", "Publisher"], ["▸", "Video bei Publishern", "Social Video, Live & Erklärformate", "Video", "Publisher"], ["◌", "Audio aus anderen Branchen", "Retention, Routine & Personalisierung", "Audio", "Andere Branchen"], ["▣", "Video aus anderen Branchen", "Creator Economy & Markenformate", "Video", "Andere Branchen"]].map(([icon, title, text, m, s]) => <button className="category-card" key={title} onClick={() => { setMedium(m as Medium); setSector(s as Sector); window.scrollTo({ top: 0, behavior: "smooth" }); }}><b>{icon}</b><strong>{title}</strong><span>{text}</span><i>→</i></button>)}</div></section>
      </>}
      {view === "review" && <ReviewQueue cases={initialCases} onOpen={setActiveCase} reviewedIds={approvedIds} onReview={async (id, decision) => { const response = await fetch(`/api/cases/${id}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision }) }); if (response.ok) setApprovedIds(current => [...current, id]); }} />}
      {view === "sources" && <Sources sources={sources} />}
    </section>
    {activeCase && <CaseDetail item={activeCase} saved={saved.includes(activeCase.id)} onClose={() => setActiveCase(null)} onSave={toggleSaved}/>} 
  </main>;
}

function ReviewQueue({ cases, onOpen, reviewedIds, onReview }: { cases: Case[]; onOpen: (item: Case) => void; reviewedIds: string[]; onReview: (id: string, decision: "approved" | "rejected") => Promise<void> }) { const review = cases.filter(c => c.status === "In Prüfung" && !reviewedIds.includes(c.id)); return <div className="admin-page"><p className="eyebrow">REDAKTION</p><h1>Review-Queue</h1><p>Prüfen Sie neue Fundstellen, bevor sie im Dashboard sichtbar werden.</p><div className="review-table">{review.length ? review.map(item => <div key={item.id}><div><Badge tone={item.medium === "Audio" ? "audio" : "video"}>{item.medium}</Badge><h3>{item.title}</h3><span>{item.source} · {item.market} · importiert heute</span></div><div className="review-actions"><button className="outline" onClick={() => onOpen(item)}>Prüfen</button><button className="outline" onClick={() => onReview(item.id, "rejected")}>Ablehnen</button><button className="primary" onClick={() => onReview(item.id, "approved")}>Freigeben</button></div></div>) : <div><span>Keine Cases warten auf Freigabe.</span></div>}</div></div>; }
function Sources({ sources }: { sources: SourceOverview[] }) {
  const [running, setRunning] = useState(false); const [message, setMessage] = useState(""); const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [homepageUrl, setHomepageUrl] = useState(""); const [feedUrl, setFeedUrl] = useState(""); const [access, setAccess] = useState<"public" | "member_link_only">("public");
  async function runNow() { setRunning(true); setMessage(""); const response = await fetch("/api/cron/ingest", { method: "POST" }); const body = await response.json(); setRunning(false); setMessage(response.ok ? "Import abgeschlossen. Seite wird aktualisiert…" : (body.error ?? "Import fehlgeschlagen.")); if (response.ok) setTimeout(() => window.location.reload(), 800); }
  async function addSource(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setRunning(true); setMessage(""); const response = await fetch("/api/sources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, homepageUrl, feedUrl, access }) }); const body = await response.json(); setRunning(false); if (!response.ok) { setMessage(body.error ?? "Quelle konnte nicht angelegt werden."); return; } window.location.reload(); }
  async function toggleSource(source: SourceOverview) { setRunning(true); const response = await fetch(`/api/sources/${source.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: !source.active }) }); setRunning(false); if (response.ok) window.location.reload(); else setMessage("Quellenstatus konnte nicht geändert werden."); }
  const lastImport = (source: SourceOverview) => source.latestRunStatus === "failed" ? "Letzter Import fehlgeschlagen" : source.lastFetchedAt ? `Letzter Abruf: ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(source.lastFetchedAt))}` : source.feedUrl ? "Noch nicht importiert" : "Manuelle Quelle";
  return <div className="admin-page"><p className="eyebrow">REDAKTION</p><h1>Quellen</h1><p>Aktive RSS-Quellen werden täglich geprüft. Mitglieder- und Quellen ohne Feed bleiben für die manuelle Recherche sichtbar.</p><div className="source-list">{sources.length ? sources.map(source => <div key={source.id}><b>{source.name.slice(0, 1)}</b><span><strong>{source.name}</strong><small>{lastImport(source)}{source.latestRunError ? ` · ${source.latestRunError}` : ""}</small></span><Badge tone={source.active ? "new" : "neutral"}>{source.active ? source.feedUrl ? "RSS aktiv" : "Manuell" : "Pausiert"}</Badge><button className="outline" onClick={() => toggleSource(source)} disabled={running}>{source.active ? "Pausieren" : "Aktivieren"}</button></div>) : <div><span>Noch keine Quellen angelegt.</span></div>}</div><div className="review-actions"><button className="primary add-source" onClick={runNow} disabled={running}>{running ? "Import läuft…" : "Quellen jetzt aktualisieren"}</button><button className="outline add-source" onClick={() => setShowForm(current => !current)}>{showForm ? "Abbrechen" : "+ Quelle hinzufügen"}</button></div>{showForm && <form className="source-form" onSubmit={addSource}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Website-URL<input type="url" value={homepageUrl} onChange={(event) => setHomepageUrl(event.target.value)} required placeholder="https://…" /></label><label>RSS-Feed-URL <small>(optional)</small><input type="url" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} placeholder="https://…/feed/" /></label><label>Zugriff<select value={access} onChange={(event) => setAccess(event.target.value as "public" | "member_link_only")}><option value="public">Öffentlich</option><option value="member_link_only">Nur Mitgliederlink</option></select></label><button className="primary" disabled={running}>Quelle speichern</button></form>}{message && <p>{message}</p>}</div>;
}
function CaseDetail({ item, saved, onClose, onSave }: { item: Case; saved: boolean; onClose: () => void; onSave: (id: string) => void }) { return <div className="modal-backdrop" onMouseDown={onClose}><article className="detail-modal" onMouseDown={e => e.stopPropagation()}><button className="close" onClick={onClose}>×</button><div className="badges"><Badge tone={item.medium === "Audio" ? "audio" : "video"}>{item.medium}</Badge><Badge>{item.sector}</Badge></div><p className="eyebrow">{item.source} · {item.market} · {item.platform}</p><h2>{item.title}</h2><p className="detail-summary">{item.summary}</p><div className="detail-grid"><div><h4>Ausgangslage</h4><p>{item.context}</p></div><div><h4>Übertragbare Maßnahme</h4><p>{item.action}</p></div></div><h4>Performance & Belege</h4>{item.metrics.length ? <div className="metrics">{item.metrics.map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.source}</small></div>)}</div> : <p className="muted">Keine Performancewerte veröffentlicht.</p>}<footer><a href={item.url} target="_blank">Originalquelle öffnen ↗</a><button className={saved ? "primary" : "outline"} onClick={() => onSave(item.id)}>{saved ? "★ Gespeichert" : "☆ Merken"}</button></footer></article></div>; }
