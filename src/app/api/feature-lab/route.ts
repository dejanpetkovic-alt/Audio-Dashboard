import { NextRequest, NextResponse } from "next/server";
import { calculateCopyability, buildImplementationBrief } from "@/lib/feature-lab-utils";
import { inspectReference } from "@/lib/reference-inspection";
import { screenshotUrl } from "@/lib/screenshot";
import { getSupabaseAdmin } from "@/lib/supabase";

const values = { implementationEffort: ["low", "medium", "high"], visibility: ["clear", "partial", "unclear"], productValue: ["high", "medium", "low"], buildPriority: ["now", "watch", "later"], status: ["research", "evaluate", "build", "done"] } as const;
function validUrl(value: unknown, optional = false) { if (optional && (value === null || value === "" || value === undefined)) return null; if (typeof value !== "string") return null; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as Record<string, unknown>;
  const text = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  const publisherSourceId = text("publisherSourceId"), productName = text("productName"), featureDescription = text("featureDescription"), referenceUrl = validUrl(body.referenceUrl), providedScreenshotUrl = validUrl(body.screenshotUrl, true);
  if (!publisherSourceId || !productName || !featureDescription || !referenceUrl || Object.entries(values).some(([key, allowed]) => !(allowed as readonly string[]).includes(String(body[key] ?? "")))) return NextResponse.json({ error: "Bitte alle Pflichtfelder mit gültigen Auswahlwerten ausfüllen." }, { status: 400 });
  const visibility = String(body.visibility) as "clear" | "partial" | "unclear";
  const effort = String(body.implementationEffort) as "high" | "medium" | "low";
  const productValue = String(body.productValue) as "high" | "medium" | "low";
  const inspection = await inspectReference(referenceUrl);
  const technicalNotes = [text("technicalNotes"), inspection.notes].filter(Boolean).join("\n\n");
  const publisherResult = await supabase.from("sources").select("name").eq("id", publisherSourceId).single();
  const publisher = publisherResult.data?.name ?? "Unbekannter Publisher";
  const { data, error } = await supabase.from("feature_lab_items").insert({ publisher_source_id: publisherSourceId, product_name: productName, feature_description: featureDescription, reference_url: referenceUrl, screenshot_url: providedScreenshotUrl ?? screenshotUrl(referenceUrl), copyability: calculateCopyability(visibility, effort, productValue), implementation_effort: effort, visibility, product_value: productValue, build_priority: body.buildPriority, status: body.status, rationale: text("rationale"), technical_notes: technicalNotes, assignee: text("assignee"), detected_tech: inspection.detectedTech, inspection_status: inspection.status, implementation_brief: buildImplementationBrief({ productName, publisher, description: featureDescription, referenceUrl, technicalNotes, detectedTech: inspection.detectedTech }) }).select("id").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data }, { status: 201 });
}
