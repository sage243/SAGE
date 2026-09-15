import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { getManagementDashboard, getProfitabilityReport } from "@/lib/reports";

export async function GET(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const view = new URL(request.url).searchParams.get("view") || "profitability";
  if (view === "dashboard") {
    return NextResponse.json(await getManagementDashboard());
  }
  return NextResponse.json(await getProfitabilityReport());
}
