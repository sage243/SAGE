import { computeLandedCost, type CurrencyCode, type DocStatus, type GoodsReceipt, type PurchaseOrder, type PurchaseOrderLine } from "./domain";
import { applyStockDelta } from "./inventory";
import { getCurrencySettings, getProduct, listProducts, listSuppliers, listWarehouses, saveProduct } from "./masters";
import { readCollection, writeCollection } from "./json-db";
import { uid } from "./utils";

const SEED_POS: PurchaseOrder[] = [
  {
    id: "po_blx_001",
    number: "PO-2026-0001",
    supplierId: "sup_beltexco_01",
    supplierName: "BELTEXCO S.A. — Groupe Rawji",
    warehouseId: "wh_limete_01",
    warehouseName: "Entrepôt Limete",
    status: "approved",
    currency: "USD",
    exchangeRate: 2850,
    orderedAt: "2026-09-14T09:00:00.000Z",
    expectedAt: "2026-09-16",
    notes: "Réassort alimentation Beltexco — sardines, tomate, lait",
    lines: [
      {
        id: "pol_1",
        productId: "prd_blx_ali_sd_001",
        sku: "ALI-SD-001",
        productName: "Sardines à l'huile d'olive (125g)",
        quantityOrdered: 120,
        quantityReceived: 0,
        unitOfMeasure: "boîte",
        unitPrice: 0.85,
        currency: "USD",
        transportCost: 0.03,
        handlingCost: 0.01,
        storageCost: 0.01,
        otherDirectCosts: 0,
        lineTotal: 102,
        landedUnitCost: 0.9,
      },
      {
        id: "pol_2",
        productId: "prd_blx_ali_tm_001",
        sku: "ALI-TM-001",
        productName: "Concentré de tomate sachet (70g)",
        quantityOrdered: 200,
        quantityReceived: 0,
        unitOfMeasure: "sachet",
        unitPrice: 0.28,
        currency: "USD",
        transportCost: 0.02,
        handlingCost: 0.01,
        storageCost: 0,
        otherDirectCosts: 0,
        lineTotal: 56,
        landedUnitCost: 0.31,
      },
      {
        id: "pol_3",
        productId: "prd_blx_ali_lt_002",
        sku: "ALI-LT-002",
        productName: "Lait en poudre sachet (400g)",
        quantityOrdered: 48,
        quantityReceived: 0,
        unitOfMeasure: "sachet",
        unitPrice: 2.1,
        currency: "USD",
        transportCost: 0.06,
        handlingCost: 0.02,
        storageCost: 0.01,
        otherDirectCosts: 0,
        lineTotal: 100.8,
        landedUnitCost: 2.19,
      },
    ],
    subtotal: 258.8,
    totalLanded: 275.52,
    createdAt: "2026-09-14T09:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
    approvedAt: "2026-09-14T10:00:00.000Z",
  },
];

const SEED_RECEIPTS: GoodsReceipt[] = [];

function lineTotals(line: Omit<PurchaseOrderLine, "lineTotal" | "landedUnitCost"> & Partial<Pick<PurchaseOrderLine, "lineTotal" | "landedUnitCost">>): PurchaseOrderLine {
  const landedUnitCost = computeLandedCost({
    purchasePrice: line.unitPrice,
    transportCost: line.transportCost,
    handlingCost: line.handlingCost,
    storageCost: line.storageCost,
    otherDirectCosts: line.otherDirectCosts,
  });
  return {
    ...line,
    quantityReceived: line.quantityReceived || 0,
    lineTotal: Number((line.quantityOrdered * line.unitPrice).toFixed(4)),
    landedUnitCost: Number(landedUnitCost.toFixed(4)),
  } as PurchaseOrderLine;
}

function orderTotals(lines: PurchaseOrderLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const totalLanded = lines.reduce((s, l) => s + l.landedUnitCost * l.quantityOrdered, 0);
  return {
    subtotal: Number(subtotal.toFixed(4)),
    totalLanded: Number(totalLanded.toFixed(4)),
  };
}

async function nextPoNumber() {
  const items = await listPurchaseOrders();
  const n = items.length + 1;
  return `PO-2026-${String(n).padStart(4, "0")}`;
}

async function nextGrnNumber() {
  const items = await listGoodsReceipts();
  const n = items.length + 1;
  return `GRN-2026-${String(n).padStart(4, "0")}`;
}

export async function listPurchaseOrders() {
  const items = await readCollection("purchase-orders.json", SEED_POS);
  return items.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
}

export async function getPurchaseOrder(id: string) {
  return (await listPurchaseOrders()).find((p) => p.id === id);
}

export async function listGoodsReceipts() {
  const items = await readCollection("goods-receipts.json", SEED_RECEIPTS);
  return items.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export async function createPurchaseOrder(input: {
  supplierId: string;
  warehouseId: string;
  currency?: CurrencyCode;
  expectedAt?: string;
  notes?: string;
  lines: {
    productId: string;
    quantityOrdered: number;
    unitPrice?: number;
    transportCost?: number;
    handlingCost?: number;
    storageCost?: number;
    otherDirectCosts?: number;
  }[];
}) {
  if (!input.lines?.length) throw new Error("Au moins une ligne produit est requise");

  const [suppliers, warehouses, products, currency] = await Promise.all([
    listSuppliers(),
    listWarehouses(),
    listProducts(),
    getCurrencySettings(),
  ]);
  const supplier = suppliers.find((s) => s.id === input.supplierId);
  const warehouse = warehouses.find((w) => w.id === input.warehouseId);
  if (!supplier) throw new Error("Fournisseur introuvable");
  if (!warehouse) throw new Error("Entrepôt introuvable");

  const lines: PurchaseOrderLine[] = input.lines.map((raw) => {
    const product = products.find((p) => p.id === raw.productId);
    if (!product) throw new Error(`Produit introuvable: ${raw.productId}`);
    if (product.kind !== "product") throw new Error(`${product.sku} est un service`);
    const qty = Number(raw.quantityOrdered);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Quantité invalide pour ${product.sku}`);
    return lineTotals({
      id: uid("pol"),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      quantityOrdered: qty,
      quantityReceived: 0,
      unitOfMeasure: product.unitOfMeasure,
      unitPrice: Number(raw.unitPrice ?? product.purchasePrice),
      currency: (input.currency as CurrencyCode) || product.purchaseCurrency || "USD",
      transportCost: Number(raw.transportCost ?? product.transportCost ?? 0),
      handlingCost: Number(raw.handlingCost ?? product.handlingCost ?? 0),
      storageCost: Number(raw.storageCost ?? product.storageCost ?? 0),
      otherDirectCosts: Number(raw.otherDirectCosts ?? product.otherDirectCosts ?? 0),
    });
  });

  const now = new Date().toISOString();
  const totals = orderTotals(lines);
  const fx = currency.rates[0]?.rate || 1;
  const po: PurchaseOrder = {
    id: uid("po"),
    number: await nextPoNumber(),
    supplierId: supplier.id,
    supplierName: supplier.legalName,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    status: "draft",
    currency: (input.currency as CurrencyCode) || lines[0]?.currency || "USD",
    exchangeRate: fx,
    orderedAt: now,
    expectedAt: input.expectedAt || undefined,
    notes: input.notes || undefined,
    lines,
    ...totals,
    createdAt: now,
    updatedAt: now,
  };

  const all = await listPurchaseOrders();
  all.unshift(po);
  await writeCollection("purchase-orders.json", all);
  return po;
}

export async function updatePurchaseOrderStatus(id: string, status: Extract<DocStatus, "approved" | "cancelled">) {
  const all = await listPurchaseOrders();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Bon de commande introuvable");
  const po = all[idx];
  if (po.status === "posted" || po.status === "cancelled") {
    throw new Error(`BC ${po.number} déjà ${po.status}`);
  }
  if (status === "approved" && po.status !== "draft") {
    throw new Error("Seuls les brouillons peuvent être approuvés");
  }

  const now = new Date().toISOString();
  all[idx] = {
    ...po,
    status,
    updatedAt: now,
    approvedAt: status === "approved" ? now : po.approvedAt,
    cancelledAt: status === "cancelled" ? now : po.cancelledAt,
  };
  await writeCollection("purchase-orders.json", all);
  return all[idx];
}

export async function receivePurchaseOrder(input: {
  purchaseOrderId: string;
  notes?: string;
  lines: { purchaseLineId: string; quantityReceived: number }[];
}) {
  const all = await listPurchaseOrders();
  const idx = all.findIndex((p) => p.id === input.purchaseOrderId);
  if (idx === -1) throw new Error("Bon de commande introuvable");
  const po = all[idx];
  if (po.status !== "approved" && po.status !== "partial") {
    throw new Error("Le BC doit être approuvé avant réception");
  }
  if (!input.lines?.length) throw new Error("Aucune ligne à réceptionner");

  const [warehouses] = await Promise.all([listWarehouses()]);
  const warehouse = warehouses.find((w) => w.id === po.warehouseId);
  if (!warehouse) throw new Error("Entrepôt introuvable");

  const now = new Date().toISOString();
  const receiptLines: GoodsReceipt["lines"] = [];

  for (const recv of input.lines) {
    const line = po.lines.find((l) => l.id === recv.purchaseLineId);
    if (!line) throw new Error(`Ligne BC introuvable: ${recv.purchaseLineId}`);
    const qty = Number(recv.quantityReceived);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const remaining = line.quantityOrdered - line.quantityReceived;
    if (qty > remaining + 0.0001) {
      throw new Error(
        `Quantité trop élevée pour ${line.sku}: reste ${remaining} ${line.unitOfMeasure}`,
      );
    }

    const product = await getProduct(line.productId);
    if (!product) throw new Error(`Produit ${line.sku} introuvable`);

    await applyStockDelta({
      type: "purchase_receipt",
      product,
      warehouse,
      quantity: qty,
      quantityDelta: qty,
      unitCost: line.landedUnitCost,
      currency: line.currency,
      referenceType: "purchase_order",
      referenceId: po.id,
      referenceNumber: po.number,
      reason: `Réception ${po.number}`,
    });

    // Refresh product costs from this receipt line
    const refreshed = await getProduct(line.productId);
    if (refreshed) {
      await saveProduct({
        ...refreshed,
        purchasePrice: line.unitPrice,
        purchaseCurrency: line.currency,
        transportCost: line.transportCost,
        handlingCost: line.handlingCost,
        storageCost: line.storageCost,
        otherDirectCosts: line.otherDirectCosts,
        supplierId: po.supplierId,
        warehouseId: po.warehouseId,
      });
    }

    line.quantityReceived = Number((line.quantityReceived + qty).toFixed(4));
    receiptLines.push({
      id: uid("grl"),
      purchaseLineId: line.id,
      productId: line.productId,
      sku: line.sku,
      productName: line.productName,
      quantityReceived: qty,
      unitOfMeasure: line.unitOfMeasure,
      unitPrice: line.unitPrice,
      landedUnitCost: line.landedUnitCost,
      currency: line.currency,
    });
  }

  if (receiptLines.length === 0) throw new Error("Aucune quantité valide à réceptionner");

  const allReceived = po.lines.every((l) => l.quantityReceived >= l.quantityOrdered - 0.0001);
  const anyReceived = po.lines.some((l) => l.quantityReceived > 0);
  po.status = allReceived ? "posted" : anyReceived ? "partial" : po.status;
  po.updatedAt = now;
  if (allReceived) po.postedAt = now;
  all[idx] = po;
  await writeCollection("purchase-orders.json", all);

  const receipt: GoodsReceipt = {
    id: uid("grn"),
    number: await nextGrnNumber(),
    purchaseOrderId: po.id,
    purchaseOrderNumber: po.number,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    status: "posted",
    receivedAt: now,
    notes: input.notes,
    lines: receiptLines,
    createdAt: now,
    updatedAt: now,
    postedAt: now,
  };
  const receipts = await listGoodsReceipts();
  receipts.unshift(receipt);
  await writeCollection("goods-receipts.json", receipts);
  return { purchaseOrder: po, receipt };
}
