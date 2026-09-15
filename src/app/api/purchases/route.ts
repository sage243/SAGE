import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { createPurchaseOrder, listGoodsReceipts, listPurchaseOrders, receivePurchaseOrder, updatePurchaseOrderStatus } from "@/lib/procurement";
import type { CurrencyCode, DocStatus } from "@/lib/domain";

export async function GET(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  if (searchParams.get("receipts") === "1") {
    return NextResponse.json(await listGoodsReceipts());
  }
  return NextResponse.json(await listPurchaseOrders());
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const action = String(body.action || "create");

    if (action === "create") {
      if (!body.supplierId || !body.warehouseId || !Array.isArray(body.lines)) {
        return NextResponse.json(
          { error: "supplierId, warehouseId et lines requis" },
          { status: 400 },
        );
      }
      const po = await createPurchaseOrder({
        supplierId: String(body.supplierId),
        warehouseId: String(body.warehouseId),
        currency: body.currency as CurrencyCode | undefined,
        expectedAt: body.expectedAt || undefined,
        notes: body.notes || undefined,
        lines: body.lines,
      });
      return NextResponse.json(po, { status: 201 });
    }

    if (action === "status") {
      const status = body.status as Extract<DocStatus, "approved" | "cancelled">;
      if (!body.id || (status !== "approved" && status !== "cancelled")) {
        return NextResponse.json({ error: "id et status (approved|cancelled) requis" }, { status: 400 });
      }
      const po = await updatePurchaseOrderStatus(String(body.id), status);
      return NextResponse.json(po);
    }

    if (action === "receive") {
      if (!body.purchaseOrderId || !Array.isArray(body.lines)) {
        return NextResponse.json(
          { error: "purchaseOrderId et lines requis" },
          { status: 400 },
        );
      }
      const result = await receivePurchaseOrder({
        purchaseOrderId: String(body.purchaseOrderId),
        notes: body.notes || undefined,
        lines: body.lines,
      });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur achats";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
