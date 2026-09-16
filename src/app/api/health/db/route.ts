import { NextResponse } from "next/server";
import { dbHealth, isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await dbHealth();
  return NextResponse.json(
    {
      databaseConfigured: isDatabaseConfigured(),
      ...health,
      engine: "postgresql",
      target: "Render PostgreSQL 18 — masters + inventory",
    },
    { status: health.ok ? 200 : 503 },
  );
}
