export type LabLevel = "high" | "medium" | "low";
export type LabVisibility = "clear" | "partial" | "unclear";

export function calculateCopyability(visibility: LabVisibility, effort: LabLevel, value: LabLevel): LabLevel {
  const visibilityPoints = { clear: 2, partial: 1, unclear: 0 }[visibility];
  const effortPoints = { low: 2, medium: 1, high: 0 }[effort];
  const valuePoints = { high: 2, medium: 1, low: 0 }[value];
  const score = visibilityPoints + effortPoints + valuePoints;
  return score >= 5 ? "high" : score >= 3 ? "medium" : "low";
}

export function buildImplementationBrief(input: { productName: string; publisher: string; description: string; referenceUrl: string; technicalNotes?: string; detectedTech?: string[] }) {
  const signals = input.detectedTech?.length ? input.detectedTech.join(", ") : "noch keine technischen Signale erkannt";
  return `Nachbau-Briefing: ${input.productName}\n\nReferenz-Publisher: ${input.publisher}\nReferenz: ${input.referenceUrl}\n\nBeobachtetes Nutzererlebnis\n${input.description}\n\nTechnische Signale\n${signals}\n${input.technicalNotes ? `\nZusatznotizen\n${input.technicalNotes}\n` : ""}\nUmsetzungsauftrag\n1. Beschreibe den UI-Ablauf mit Einstiegs-, Wiedergabe- und Rückkehrpunkt.\n2. Skizziere Datenmodell, Schnittstellen und benötigte Komponenten.\n3. Benenne offene Annahmen, Rechte-/Datenschutz- und Produktionsrisiken.\n4. Formuliere Akzeptanzkriterien und einen inkrementellen Implementierungsplan.\n\nWichtig: Technische Signale und externe Referenzen vor der Umsetzung erneut prüfen; sie sind kein Nachweis für interne Implementierungsdetails.`;
}
