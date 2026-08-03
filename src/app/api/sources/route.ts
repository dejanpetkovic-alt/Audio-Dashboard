import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: ["INMA", "The Audiencers", "WAN-IFRA", "Nieman Lab", "Digiday", "DIE ZEIT"],
    schedule: "0 6 * * * Europe/Berlin",
    policy: "public-metadata-and-links-only",
  });
}
