import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { listSuppliers, saveSupplier } from "@/lib/masters";
import type { CurrencyCode, PartyStatus } from "@/lib/domain";

export async function GET() {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await listSuppliers());
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await request.json();
  if (!body.legalName || !body.phone || !body.city || !body.code) {
    return NextResponse.json({ error: "code, legalName, phone, city requis" }, { status: 400 });
  }
  const supplier = await saveSupplier({
    id: body.id,
    code: String(body.code).trim(),
    legalName: String(body.legalName).trim(),
    contactPerson: body.contactPerson || undefined,
    phone: String(body.phone).trim(),
    email: body.email || undefined,
    address: body.address || undefined,
    city: String(body.city).trim(),
    paymentTermsDays: Number(body.paymentTermsDays || 0),
    productCategories: Array.isArray(body.productCategories)
      ? body.productCategories
      : String(body.productCategories || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
    status: (body.status as PartyStatus) || "actif",
    notes: body.notes || undefined,
    outstandingBalance: Number(body.outstandingBalance || 0),
    outstandingCurrency: (body.outstandingCurrency as CurrencyCode) || "USD",
  });
  return NextResponse.json(supplier, { status: body.id ? 200 : 201 });
}
