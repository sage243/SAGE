import type {
  CurrencyCode,
  Product,
  StockBalance,
  StockMovement,
  StockMovementType,
  Warehouse,
} from "./domain";
import { listProducts, listWarehouses, saveProduct } from "./masters";
import { readCollection, writeCollection } from "./json-db";
import { uid } from "./utils";

const SEED_MOVEMENTS: StockMovement[] = [];
const SEED_BALANCES: StockBalance[] = [];

export async function listStockMovements() {
  const items = await readCollection("stock-movements.json", SEED_MOVEMENTS);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listStockBalances() {
  const balances = await readCollection("stock-balances.json", SEED_BALANCES);
  if (balances.length > 0) return balances.sort((a, b) => a.productName.localeCompare(b.productName, "fr"));

  // Bootstrap balances from product master quantityOnHand (one-time)
  const [products, warehouses] = await Promise.all([listProducts(), listWarehouses()]);
  const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0];
  const seeded: StockBalance[] = [];
  for (const p of products) {
    if (p.kind !== "product") continue;
    const wh =
      warehouses.find((w) => w.id === p.warehouseId) ||
      defaultWh;
    if (!wh) continue;
    seeded.push({
      id: uid("bal"),
      productId: p.id,
      sku: p.sku,
      productName: p.name,
      warehouseId: wh.id,
      warehouseName: wh.name,
      quantityOnHand: Math.max(0, p.quantityOnHand),
      unitOfMeasure: p.unitOfMeasure,
      averageUnitCost: p.landedCost,
      currency: p.purchaseCurrency,
      reorderLevel: p.reorderLevel,
      updatedAt: new Date().toISOString(),
    });
  }
  await writeCollection("stock-balances.json", seeded);
  return seeded;
}

async function writeBalances(items: StockBalance[]) {
  await writeCollection("stock-balances.json", items);
}

async function appendMovement(movement: StockMovement) {
  const items = await listStockMovements();
  items.unshift(movement);
  await writeCollection("stock-movements.json", items);
  return movement;
}

export async function getStockBalance(productId: string, warehouseId: string) {
  const balances = await listStockBalances();
  return balances.find((b) => b.productId === productId && b.warehouseId === warehouseId);
}

export async function applyStockDelta(input: {
  type: StockMovementType;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
  /** Positive = inbound, negative = outbound */
  quantityDelta: number;
  unitCost: number;
  currency: CurrencyCode;
  referenceType?: StockMovement["referenceType"];
  referenceId?: string;
  referenceNumber?: string;
  reason?: string;
  createdBy?: string;
  /** When issuing against a reservation, reduce reserved qty too */
  releaseReserved?: number;
}) {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantité invalide");
  }
  if (input.quantityDelta === 0) {
    throw new Error("Delta stock nul");
  }

  const balances = await listStockBalances();
  const now = new Date().toISOString();
  let bal = balances.find(
    (b) => b.productId === input.product.id && b.warehouseId === input.warehouse.id,
  );

  const nextQty = (bal?.quantityOnHand || 0) + input.quantityDelta;
  if (nextQty < -0.0001) {
    throw new Error(
      `Stock insuffisant pour ${input.product.sku} à ${input.warehouse.name} (dispo ${bal?.quantityOnHand || 0})`,
    );
  }

  if (!bal) {
    bal = {
      id: uid("bal"),
      productId: input.product.id,
      sku: input.product.sku,
      productName: input.product.name,
      warehouseId: input.warehouse.id,
      warehouseName: input.warehouse.name,
      quantityOnHand: Math.max(0, nextQty),
      quantityReserved: 0,
      unitOfMeasure: input.product.unitOfMeasure,
      averageUnitCost: input.unitCost,
      currency: input.currency,
      reorderLevel: input.product.reorderLevel,
      updatedAt: now,
    };
    balances.unshift(bal);
  } else {
    // Weighted average cost on inbound receipts
    if (input.quantityDelta > 0 && nextQty > 0) {
      const prevValue = bal.quantityOnHand * bal.averageUnitCost;
      const addValue = input.quantityDelta * input.unitCost;
      bal.averageUnitCost = (prevValue + addValue) / nextQty;
    }
    bal.quantityOnHand = Math.max(0, nextQty);
    if (input.releaseReserved && input.releaseReserved > 0) {
      bal.quantityReserved = Math.max(0, (bal.quantityReserved || 0) - input.releaseReserved);
    }
    bal.productName = input.product.name;
    bal.sku = input.product.sku;
    bal.warehouseName = input.warehouse.name;
    bal.unitOfMeasure = input.product.unitOfMeasure;
    bal.reorderLevel = input.product.reorderLevel;
    bal.currency = input.currency;
    bal.updatedAt = now;
  }

  await writeBalances(balances);

  // Keep product master aggregate in sync (landed cost updated by caller on purchase receipt)
  const allForProduct = balances.filter((b) => b.productId === input.product.id);
  const aggregate = allForProduct.reduce((sum, b) => sum + b.quantityOnHand, 0);
  const fresh = await listProducts().then((ps) => ps.find((p) => p.id === input.product.id));
  if (fresh) {
    await saveProduct({
      ...fresh,
      quantityOnHand: aggregate,
      warehouseId: input.warehouse.id,
    });
  }

  return appendMovement({
    id: uid("mov"),
    type: input.type,
    productId: input.product.id,
    sku: input.product.sku,
    productName: input.product.name,
    warehouseId: input.warehouse.id,
    warehouseName: input.warehouse.name,
    quantity: input.quantity,
    quantityDelta: input.quantityDelta,
    unitOfMeasure: input.product.unitOfMeasure,
    unitCost: input.unitCost,
    currency: input.currency,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    referenceNumber: input.referenceNumber,
    reason: input.reason,
    createdAt: now,
    createdBy: input.createdBy || "gestion",
  });
}

export async function reserveStock(input: {
  productId: string;
  warehouseId: string;
  quantity: number;
}) {
  const balances = await listStockBalances();
  const bal = balances.find(
    (b) => b.productId === input.productId && b.warehouseId === input.warehouseId,
  );
  if (!bal) throw new Error("Solde stock introuvable pour réservation");
  const reserved = bal.quantityReserved || 0;
  const available = bal.quantityOnHand - reserved;
  if (input.quantity > available + 0.0001) {
    throw new Error(
      `Stock disponible insuffisant pour ${bal.sku} (dispo ${available}, demandé ${input.quantity})`,
    );
  }
  bal.quantityReserved = reserved + input.quantity;
  bal.updatedAt = new Date().toISOString();
  await writeBalances(balances);
  return bal;
}

export async function releaseReservation(input: {
  productId: string;
  warehouseId: string;
  quantity: number;
}) {
  const balances = await listStockBalances();
  const bal = balances.find(
    (b) => b.productId === input.productId && b.warehouseId === input.warehouseId,
  );
  if (!bal) return;
  bal.quantityReserved = Math.max(0, (bal.quantityReserved || 0) - input.quantity);
  bal.updatedAt = new Date().toISOString();
  await writeBalances(balances);
  return bal;
}

export async function createStockAdjustment(input: {
  productId: string;
  warehouseId: string;
  quantity: number;
  direction: "in" | "out" | "loss";
  reason: string;
  unitCost?: number;
}) {
  const [products, warehouses] = await Promise.all([listProducts(), listWarehouses()]);
  const product = products.find((p) => p.id === input.productId);
  const warehouse = warehouses.find((w) => w.id === input.warehouseId);
  if (!product) throw new Error("Produit introuvable");
  if (!warehouse) throw new Error("Entrepôt introuvable");
  if (product.kind !== "product") throw new Error("Les services n’ont pas de stock");

  const type: StockMovementType =
    input.direction === "loss" ? "loss" : input.direction === "in" ? "adjustment" : "adjustment";
  const delta =
    input.direction === "in" ? input.quantity : -Math.abs(input.quantity);

  return applyStockDelta({
    type,
    product,
    warehouse,
    quantity: Math.abs(input.quantity),
    quantityDelta: delta,
    unitCost: input.unitCost ?? product.landedCost,
    currency: product.purchaseCurrency,
    referenceType: "adjustment",
    reason: input.reason,
  });
}

export async function getInventorySnapshot() {
  const [balances, movements] = await Promise.all([listStockBalances(), listStockMovements()]);
  const low = balances.filter((b) => b.reorderLevel > 0 && b.quantityOnHand <= b.reorderLevel);
  return {
    balanceLines: balances.length,
    movementCount: movements.length,
    lowBalanceCount: low.length,
    recentMovements: movements.slice(0, 8),
    lowBalances: low.slice(0, 8),
  };
}
