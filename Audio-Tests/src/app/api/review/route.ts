import { NextResponse } from "next/server";
import { cases } from "@/lib/cases";

/**
 * Review endpoint contract. Connect this handler to the repository layer once
 * SSO and PostgreSQL are configured; fixtures intentionally remain read-only.
 */
export async function GET() {
  return NextResponse.json({ data: cases.filter((item) => item.status === "In Prüfung") });
}
