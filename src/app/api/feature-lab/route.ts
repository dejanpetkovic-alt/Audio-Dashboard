import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const values = { copyability: ["high", "medium", "low"], implementationEffort: ["low", "medium", "high"], visibility: ["clear", "partial", "unclear"], productValue: ["high", "medium", "low"], buildPriority: ["now", "watch", "later"], status: ["research", "evaluate", "build", "done"] } as const;
function validUrl(value: unknown, optional = false) { if (optional && (value === null || value === "" || value === undefined)) return null; if (typeof value !== "string") return null; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin(); if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json() as Record<string, unknown>; const text = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  const publisherSourceId = text("publisherSourceId"), productName = text("productName"), featureDescription = text("featureDescription"), referenceUrl = validUrl(body.referenceUrl), screenshotUrl = validUrl(body.screenshotUrl, true);
  if (!publisherSourceId || !productName || !featureDescription || !referenceUrl || Object.entries(values).some(([key, allowed]) => !(allowed as readonly string[]).includes(String(body[key] ?? "")))) return NextResponse.json({ error: "Bitte alle Pflichtfelder mit gültigen Auswahlwerten ausfüllen." }, { status: 400 });
  const { data, error } = await supabase.from("feature_lab_items").insert({ publisher_source_id: publisherSourceId, product_name: productName, feature_description: featureDescription, reference_url: referenceUrl, screenshot_url: screenshotUrl, copyability: body.copyability, implementation_effort: body.implementationEffort, visibility: body.visibility, product_value: body.productValue, build_priority: body.buildPriority, status: body.status, rationale: text("rationale"), technical_notes: text("technicalNotes") }).select("id").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data }, { status: 201 });
}
