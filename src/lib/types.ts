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
