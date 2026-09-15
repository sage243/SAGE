import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { deleteProduct, listProducts, saveProduct } from "@/lib/masters";
import type { CurrencyCode, ProductKind, ProductStatus } from "@/lib/domain";
import type { DivisionSlug } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin") === "1";
  if (admin && !(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let products = await listProducts();
  if (!admin) {
    products = products.filter((p) => p.status === "active" && p.publicVisible);
  }
  const activity = searchParams.get("activity");
  const kind = searchParams.get("kind");
  if (activity) products = products.filter((p) => p.activity === activity);
  if (kind === "product" || kind === "service") {
    products = products.filter((p) => p.kind === kind);
  }
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await request.json();
  const required = ["sku", "name", "activity", "category", "unitOfMeasure"] as const;
  for (const key of required) {
    if (!body[key] || String(body[key]).trim() === "") {
      return NextResponse.json({ error: `Champ requis: ${key}` }, { status: 400 });
    }
  }

  const product = await saveProduct({
    id: body.id,
    sku: String(body.sku).trim(),
    name: String(body.name).trim(),
    description: String(body.description || "").trim(),
    kind: (body.kind as ProductKind) || "product",
    activity: body.activity as DivisionSlug,
    category: String(body.category).trim(),
    subcategory: body.subcategory ? String(body.subcategory).trim() : undefined,
    brand: body.brand ? String(body.brand).trim() : undefined,
    unitOfMeasure: String(body.unitOfMeasure).trim(),
    purchasePrice: Number(body.purchasePrice || 0),
    purchaseCurrency: (body.purchaseCurrency as CurrencyCode) || "USD",
    transportCost: Number(body.transportCost || 0),
    handlingCost: Number(body.handlingCost || 0),
    storageCost: Number(body.storageCost || 0),
    otherDirectCosts: Number(body.otherDirectCosts || 0),
    sellingPrice: Number(body.sellingPrice || 0),
    wholesalePrice: Number(body.wholesalePrice || 0),
    retailPrice: Number(body.retailPrice || 0),
    sellingCurrency: (body.sellingCurrency as CurrencyCode) || "USD",
    priceLabel: String(body.priceLabel || `${Number(body.sellingPrice || 0)} USD`),
    minStock: Number(body.minStock || 0),
    maxStock: Number(body.maxStock || 0),
    reorderLevel: Number(body.reorderLevel || 0),
    quantityOnHand: Number(body.quantityOnHand || 0),
    supplierId: body.supplierId || undefined,
    warehouseId: body.warehouseId || undefined,
    batchLot: body.batchLot || undefined,
    expiryDate: body.expiryDate || undefined,
    status: (body.status as ProductStatus) || "active",
    featured: Boolean(body.featured),
    publicVisible: body.publicVisible !== false,
    tags: Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
    stockNote: body.stockNote || undefined,
  });

  return NextResponse.json(product, { status: body.id ? 200 : 201 });
}

export async function DELETE(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}
