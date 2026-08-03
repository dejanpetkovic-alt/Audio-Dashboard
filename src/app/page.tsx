import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Dashboard from "./dashboard-client";
import { hasValidServerSession } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function Page() {
  const session = (await cookies()).get("media_pulse_session")?.value;
  if (!hasValidServerSession(session)) redirect("/login");
  const data = await getDashboardData();
  return <Dashboard initialCases={data.cases} sourceNames={data.sourceNames} connected={data.connected} loadError={data.loadError} />;
}
