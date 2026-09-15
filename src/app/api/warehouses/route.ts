import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { listWarehouses } from "@/lib/masters";

export async function GET() {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await listWarehouses());
}
