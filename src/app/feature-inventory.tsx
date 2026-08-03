"use client";

import type { ProductFeature } from "@/lib/types";

export default function FeatureInventory({ features }: { features: ProductFeature[] }) {
  const live = features.filter((feature) => feature.status === "Live");
  const render = (area: ProductFeature["area"]) => live.filter((feature) => feature.area === area).map((feature) => <article className="feature-card" key={feature.id}>
    <div><span className={`feature-icon ${area.toLowerCase()}`}>{area === "Audio" ? "A" : "V"}</span><span className="feature-status">{feature.status}</span></div>
    <h3>{feature.title}</h3><p>{feature.description}</p>
    <footer>{feature.surfaces.map((surface) => <span key={surface}>{surface}</span>)}</footer>
  </article>);

  return <div className="feature-page"><p className="eyebrow">PRODUKT-INVENTAR</p><h1>Unser Angebot</h1><p className="feature-intro">Diese Funktionen bilden die Referenz für den künftigen Branchenvergleich. Der Benchmark-Status wird erst angezeigt, wenn eine Entwicklung mit belastbaren Cases belegt ist.</p>
    <section className="feature-summary"><div><strong>{live.length}</strong><span>Features live</span></div><div><strong>{live.filter((feature) => feature.area === "Audio").length}</strong><span>Audio-Funktionen</span></div><div><strong>{live.filter((feature) => feature.area === "Video").length}</strong><span>Video-Funktionen</span></div><p>Branchenabgleich wird mit dem Trend-Radar ergänzt.</p></section>
    <section><div className="section-heading"><div><p className="eyebrow">AUDIO</p><h2>Audio-Angebot</h2></div></div><div className="feature-grid">{render("Audio")}</div></section>
    <section className="feature-section"><div className="section-heading"><div><p className="eyebrow">VIDEO</p><h2>Video-Angebot</h2></div></div><div className="feature-grid">{render("Video")}</div></section>
  </div>;
}
