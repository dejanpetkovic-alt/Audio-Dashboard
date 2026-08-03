export type Medium = "Audio" | "Video";
export type Sector = "Publisher" | "Andere Branchen";
export type Status = "Freigegeben" | "In Prüfung";

export type Metric = { label: string; value: string; source: string; kind?: string; unit?: string | null; period?: string | null; evidenceUrl?: string };
export type Case = {
  id: string; title: string; source: string; sourceType: "Netzwerk" | "Publisher" | "Plattform";
  url: string; excerpt: string; summary: string; medium: Medium; sector: Sector;
  market: "DACH" | "International"; platform: "Web" | "App" | "Web & App";
  format: string; tags: string[]; publishedAt: string; status: Status; metrics: Metric[];
  action: string; context: string; saved?: boolean; isNew?: boolean;
};

export type ProductFeature = {
  id: string; title: string; area: "Audio" | "Video"; status: "Live" | "In Arbeit" | "Geplant";
  surfaces: string[]; description: string;
};

export type TrendAssessment = { featureId: string; status: "Abgedeckt" | "Lücke" | "Beobachten" | "Pionier"; rationale: string };
export type TrendEvidence = { id: string; source: string; title: string; url: string; publishedAt: string | null };
export type TrendSignal = {
  id: string; title: string; summary: string; area: "Audio" | "Video" | "Audio & Video";
  maturity: "Frühes Signal" | "Im Aufschwung" | "Branchenstandard"; status: "Entwurf" | "Veröffentlicht";
  observedAt: string; evidence: TrendEvidence[]; assessments: TrendAssessment[];
};
