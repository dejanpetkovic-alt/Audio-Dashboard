import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion";
import { hasValidServerSession } from "@/lib/session";

export const maxDuration = 60;

async function ingest(request: NextRequest) {
  const cronAuthorized = Boolean(process.env.CRON_SECRET) && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const sessionAuthorized = request.method === "POST" && hasValidServerSession(request.cookies.get("media_pulse_session")?.value);
  if (!cronAuthorized && !sessionAuthorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ data: await runIngestion() }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 500 }); }
}

export async function GET(request: NextRequest) { return ingest(request); }
export async function POST(request: NextRequest) { return ingest(request); }
