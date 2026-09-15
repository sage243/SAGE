import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { listCustomers, saveCustomer } from "@/lib/masters";
import type { CurrencyCode, CustomerType, PartyStatus } from "@/lib/domain";

export async function GET() {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await listCustomers());
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await request.json();
  if (!body.legalName || !body.phone || !body.city || !body.code) {
    return NextResponse.json({ error: "code, legalName, phone, city requis" }, { status: 400 });
  }
  const customer = await saveCustomer({
    id: body.id,
    code: String(body.code).trim(),
    type: (body.type as CustomerType) || "entreprise",
    legalName: String(body.legalName).trim(),
    contactPerson: body.contactPerson || undefined,
    phone: String(body.phone).trim(),
    whatsapp: body.whatsapp || undefined,
    email: body.email || undefined,
    address: body.address || undefined,
    city: String(body.city).trim(),
    taxId: body.taxId || undefined,
    creditLimit: Number(body.creditLimit || 0),
    creditLimitCurrency: (body.creditLimitCurrency as CurrencyCode) || "USD",
    paymentTermsDays: Number(body.paymentTermsDays || 0),
    assignedSalesperson: body.assignedSalesperson || undefined,
    status: (body.status as PartyStatus) || "actif",
    notes: body.notes || undefined,
  });
  return NextResponse.json(customer, { status: body.id ? 200 : 201 });
}
