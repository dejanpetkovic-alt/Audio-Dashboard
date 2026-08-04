export type ReferenceInspection = { status: "scanned" | "unavailable"; detectedTech: string[]; notes: string };

const signatures: Array<[RegExp, string]> = [
  [/<video\\b|videojs|video-js/i, "HTML5/Video.js-Video"],
  [/<audio\\b|audiojs/i, "HTML5-Audio"],
  [/(youtube\\.com|youtu\\.be|youtube-nocookie)/i, "YouTube-Einbettung"],
  [/(spotify\\.com\\/embed|open\\.spotify)/i, "Spotify-Einbettung"],
  [/(jwplayer|jw-player)/i, "JW Player"],
  [/(brightcove)/i, "Brightcove"],
  [/(theoplayer)/i, "THEOplayer"],
  [/(mux\\.com|mux-player)/i, "Mux"],
  [/(transcript|untertitel|captions|subtitles)/i, "Transkript/Untertitel-Signal"],
  [/(text-to-speech|tts|listen to this article|vorlesefunktion)/i, "Text-to-Speech-Signal"],
];

export async function inspectReference(url: string): Promise<ReferenceInspection> {
  try {
    const response = await fetch(url, { headers: { "user-agent": "MediaPulseResearch/1.0" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const detectedTech = signatures.filter(([pattern]) => pattern.test(html)).map(([, name]) => name);
    return { status: "scanned", detectedTech, notes: detectedTech.length ? `Automatischer Quellcode-Check: ${detectedTech.join(", ")}. Technische Signale sind kein Produktbeweis.` : "Automatischer Quellcode-Check abgeschlossen: keine eindeutigen Audio-/Video-Signale gefunden." };
  } catch {
    return { status: "unavailable", detectedTech: [], notes: "Automatischer Quellcode-Check war für diese Referenz nicht verfügbar. Bitte manuell prüfen." };
  }
}
