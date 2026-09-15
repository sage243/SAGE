import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { listCorrespondences, saveCorrespondence } from "@/lib/correspondence";
import type { CorrespondenceDirection, CorrespondenceStatus } from "@/lib/correspondence-types";

export async function GET() {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await listCorrespondences());
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body.reference || !body.subject || !body.counterpartyName || !body.date) {
      return NextResponse.json(
        { error: "reference, date, subject et counterpartyName requis" },
        { status: 400 },
      );
    }
    const item = await saveCorrespondence({
      id: body.id,
      reference: String(body.reference).trim(),
      direction: (body.direction as CorrespondenceDirection) || "outbound",
      status: (body.status as CorrespondenceStatus) || "en_attente_reponse",
      date: String(body.date),
      subject: String(body.subject).trim(),
      counterpartyType: body.counterpartyType || "supplier",
      counterpartyId: body.counterpartyId || undefined,
      counterpartyName: String(body.counterpartyName).trim(),
      counterpartyAddress: body.counterpartyAddress || undefined,
      toAttention: body.toAttention || undefined,
      fromName: String(body.fromName || "SAGE SARL").trim(),
      fromTitle: String(body.fromTitle || "").trim(),
      bodySummary: String(body.bodySummary || "").trim(),
      requestedItems: Array.isArray(body.requestedItems)
        ? body.requestedItems.map(String)
        : String(body.requestedItems || "")
            .split("\n")
            .map((t: string) => t.trim())
            .filter(Boolean),
      cc: Array.isArray(body.cc) ? body.cc.map(String) : undefined,
      attachmentPath: body.attachmentPath || undefined,
      attachmentLabel: body.attachmentLabel || undefined,
    });
    return NextResponse.json(item, { status: body.id ? 200 : 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur correspondance";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
