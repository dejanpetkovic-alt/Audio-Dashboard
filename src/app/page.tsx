import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Dashboard from "./dashboard-client";
import { hasValidServerSession } from "@/lib/session";

export default async function Page() {
  const session = (await cookies()).get("media_pulse_session")?.value;
  if (!hasValidServerSession(session)) redirect("/login");
  return <Dashboard />;
}
