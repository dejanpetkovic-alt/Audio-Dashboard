import { NextRequest, NextResponse } from "next/server";
import { cases } from "@/lib/cases";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const medium = params.get("medium");
  const sector = params.get("sector");
  const results = cases.filter((item) =>
    (!medium || item.medium === medium) && (!sector || item.sector === sector) && item.status === "Freigegeben"
  );
  return NextResponse.json({ data: results, lastUpdated: "2026-08-03T06:00:00+02:00" });
}
