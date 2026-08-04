"use client";

import { type FormEvent, useMemo, useState } from "react";
import type { TrendEvidence, TrendSignal } from "@/lib/types";
import type { SourceOverview } from "@/lib/dashboard-data";

const aliases: Record<string, string[]> = {
  "The New York Times": ["new york times", "nyt"], "Süddeutsche Zeitung / SZ": ["süddeutsche", "sueddeutsche", " sz "],
  "ZEIT ONLINE": ["zeit online", "die zeit"], "The Guardian": ["the guardian", "guardian"], "The Washington Post": ["washington post", "wapo"],
};
const haystack = (value: string) => ` ${value.toLocaleLowerCase("de").replace(/[^a-z0-9äöüß]+/g, " ")} `;
function suggestedPublisher(sources: SourceOverview[], evidence: TrendEvidence) {
  const text = haystack(`${evidence.source} ${evidence.title}`);
  return sources.find((source) => {
    const names = aliases[source.name] ?? [source.name];
    return names.some((name) => haystack(name).trim().length > 3 && text.includes(haystack(name)));
  });
}

export default function TrendToPublisher({ trend, evidence, sources, onClose }: { trend: TrendSignal; evidence: TrendEvidence; sources: SourceOverview[]; onClose: () => void }) {
  const suggested = useMemo(() => suggestedPublisher(sources, evidence), [sources, evidence]);
  const [sourceId, setSourceId] = useState(suggested?.id ?? ""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/publisher-features", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceId, observedFeature: form.get("observedFeature"), productFeatureId: "", originTrendId: trend.id, platforms: String(form.get("platforms") ?? "").split(",").map((item) => item.trim()).filter(Boolean), status: "Aktuell dokumentiert", evidenceQuality: "Branchenquelle", evidenceUrl: evidence.url, evidenceLabel: `${evidence.source}: ${evidence.title}`, notes: `Aus Trend-Radar übernommen: ${trend.title}` }) });
    const body = await response.json(); setSaving(false); if (!response.ok) { setError(body.error ?? "Übernahme nicht möglich."); return; } window.location.reload();
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="trend-transfer" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="close" onClick={onClose}>×</button><p className="eyebrow">IN PUBLISHER-MONITOR ÜBERNEHMEN</p><h2>{trend.title}</h2><p>Der Branchenbeleg wird mit dem Trend verknüpft. Eine automatische Erkennung ist nur ein Vorschlag und kann jederzeit geändert werden.</p><label>Publisher<select name="sourceId" required value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="" disabled>Publisher auswählen</option>{sources.map((source) => <option value={source.id} key={source.id}>{source.name}</option>)}</select></label>{suggested && <small className="form-message">Automatisch erkannt: {suggested.name}</small>}<label>Beobachtetes Feature<input name="observedFeature" defaultValue={evidence.title} required /></label><label>Plattformen<input name="platforms" placeholder="Web, App, E-Paper" /></label><label>Beleg<input value={`${evidence.source}: ${evidence.title}`} readOnly /></label>{error && <p className="form-message">{error}</p>}<footer><button type="button" className="outline" onClick={onClose}>Abbrechen</button><button className="primary" disabled={saving}>{saving ? "Übernimmt…" : "In Monitor übernehmen"}</button></footer></form></div>;
}
