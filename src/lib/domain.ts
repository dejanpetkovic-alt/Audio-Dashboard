/**
 * Persistent-domain contracts for the production repository layer.
 * The UI deliberately uses fixtures until DATABASE_URL is configured.
 */
export type Source = {
  id: string; name: string; homepageUrl: string; feedUrl?: string;
  access: "public" | "member-link-only"; active: boolean; lastFetchedAt?: Date;
};

export type IngestionRun = {
  id: string; sourceId: string; startedAt: Date; finishedAt?: Date;
  status: "running" | "completed" | "failed"; importedCount: number; error?: string;
};

export type PerformanceMetric = {
  id: string; caseId: string; kind: "reach" | "engagement" | "watch_time" | "listen_time" | "completion" | "conversion" | "subscriptions" | "revenue" | "production_effort";
  value?: string; unit?: string; period?: string; evidenceUrl: string; evidenceLabel: string;
};

export type ReviewDecision = {
  id: string; caseId: string; reviewerId: string; decision: "approved" | "rejected" | "changes_requested";
  note?: string; createdAt: Date;
};

export type UserSavedCase = { userId: string; caseId: string; note?: string; savedAt: Date };
