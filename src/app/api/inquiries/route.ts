import { NextResponse } from "next/server";
import { createInquiry, listInquiries, updateInquiry } from "@/lib/store";
import type { DivisionSlug, InquiryStatus } from "@/lib/types";

export async function GET() {
  const items = await listInquiries();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const required = ["fullName", "phone", "city", "division", "message"] as const;
  for (const key of required) {
    if (!body[key] || String(body[key]).trim() === "") {
      return NextResponse.json({ error: `Champ requis: ${key}` }, { status: 400 });
    }
  }

  const inquiry = await createInquiry({
    fullName: String(body.fullName).trim(),
    organization: body.organization ? String(body.organization).trim() : undefined,
    phone: String(body.phone).trim(),
    email: body.email ? String(body.email).trim() : undefined,
    city: String(body.city).trim(),
    division: body.division as DivisionSlug,
    offerId: body.offerId || undefined,
    offerName: body.offerName || undefined,
    message: String(body.message).trim(),
    priority: body.priority === "haute" ? "haute" : "normale",
  });

  return NextResponse.json(inquiry, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }
  try {
    const updated = await updateInquiry(String(body.id), {
      status: body.status as InquiryStatus | undefined,
      priority: body.priority,
      internalNote: body.internalNote,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }
}
