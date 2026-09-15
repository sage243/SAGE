import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import { createStockAdjustment, getInventorySnapshot, listStockBalances, listStockMovements } from "@/lib/inventory";

export async function GET(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "balances";
  if (view === "movements") {
    return NextResponse.json(await listStockMovements());
  }
  if (view === "snapshot") {
    return NextResponse.json(await getInventorySnapshot());
  }
  return NextResponse.json(await listStockBalances());
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body.productId || !body.warehouseId || !body.quantity || !body.direction || !body.reason) {
      return NextResponse.json(
        { error: "productId, warehouseId, quantity, direction et reason requis" },
        { status: 400 },
      );
    }
    const direction = body.direction as "in" | "out" | "loss";
    if (direction !== "in" && direction !== "out" && direction !== "loss") {
      return NextResponse.json({ error: "direction invalide" }, { status: 400 });
    }
    const movement = await createStockAdjustment({
      productId: String(body.productId),
      warehouseId: String(body.warehouseId),
      quantity: Number(body.quantity),
      direction,
      reason: String(body.reason),
      unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
    });
    return NextResponse.json(movement, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur stock";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
