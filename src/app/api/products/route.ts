import { NextResponse } from "next/server";
import { deleteOffer, listOffers, saveOffer } from "@/lib/store";
import type { DivisionSlug, OfferKind, OfferStatus } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get("division");
  const status = searchParams.get("status");
  const admin = searchParams.get("admin") === "1";

  let offers = await listOffers();
  if (!admin) {
    offers = offers.filter((o) => o.status === "active");
  }
  if (division) {
    offers = offers.filter((o) => o.division === division);
  }
  if (status && admin) {
    offers = offers.filter((o) => o.status === status);
  }
  return NextResponse.json(offers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const required = ["division", "kind", "name", "description", "priceLabel"] as const;
  for (const key of required) {
    if (!body[key] || String(body[key]).trim() === "") {
      return NextResponse.json({ error: `Champ requis: ${key}` }, { status: 400 });
    }
  }

  const offer = await saveOffer({
    id: body.id,
    division: body.division as DivisionSlug,
    kind: body.kind as OfferKind,
    name: String(body.name).trim(),
    description: String(body.description).trim(),
    priceLabel: String(body.priceLabel).trim(),
    unit: body.unit ? String(body.unit).trim() : undefined,
    tags: Array.isArray(body.tags)
      ? body.tags.map((t: string) => String(t).trim()).filter(Boolean)
      : String(body.tags || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
    status: (body.status as OfferStatus) || "active",
    featured: Boolean(body.featured),
    stockNote: body.stockNote ? String(body.stockNote).trim() : undefined,
  });

  return NextResponse.json(offer, { status: body.id ? 200 : 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }
  await deleteOffer(id);
  return NextResponse.json({ ok: true });
}
