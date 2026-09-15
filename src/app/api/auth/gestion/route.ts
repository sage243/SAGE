import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GESTION_SESSION_COOKIE,
  gestionLoginOk,
  isGestionAuthenticated,
} from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ authenticated: await isGestionAuthenticated() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!gestionLoginOk(String(body.username || ""), String(body.password || ""))) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(GESTION_SESSION_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(GESTION_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
