import {
  computeGrossMargin,
  type CurrencyCode,
  type Delivery,
  type Invoice,
  type Payment,
  type Quotation,
  type SalesLine,
  type SalesOrder,
} from "./domain";
import { applyStockDelta, getStockBalance, releaseReservation, reserveStock } from "./inventory";
import {
  getCurrencySettings,
  getProduct,
  listCustomers,
  listProducts,
  listWarehouses,
} from "./masters";
import { readCollection, writeCollection } from "./json-db";
import { uid } from "./utils";

function money(n: number) {
  return Number(n.toFixed(4));
}

function buildSalesLine(input: {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  currency: CurrencyCode;
  unitCost: number;
  quantityDelivered?: number;
}): SalesLine {
  const lineTotal = money(input.quantity * input.unitPrice);
  const { grossProfit, marginPct } = computeGrossMargin(input.unitPrice, input.unitCost);
  return {
    id: uid("sl"),
    productId: input.productId,
    sku: input.sku,
    productName: input.productName,
    quantity: input.quantity,
    quantityDelivered: input.quantityDelivered || 0,
    unitOfMeasure: input.unitOfMeasure,
    unitPrice: input.unitPrice,
    currency: input.currency,
    unitCost: input.unitCost,
    lineTotal,
    grossProfit: money(grossProfit * input.quantity),
    marginPct: money(marginPct),
  };
}

function totals(lines: SalesLine[]) {
  const subtotal = money(lines.reduce((s, l) => s + l.lineTotal, 0));
  const totalCost = money(lines.reduce((s, l) => s + l.unitCost * l.quantity, 0));
  const grossProfit = money(subtotal - totalCost);
  const marginPct = subtotal > 0 ? money((grossProfit / subtotal) * 100) : 0;
  return { subtotal, totalCost, grossProfit, marginPct };
}

async function nextNumber(prefix: string, file: string, seed: unknown[]) {
  const items = await readCollection(file, seed);
  return `${prefix}-${String(items.length + 1).padStart(4, "0")}`;
}

const SEED_QUOTATIONS: Quotation[] = [];
const SEED_ORDERS: SalesOrder[] = [];
const SEED_DELIVERIES: Delivery[] = [];
const SEED_INVOICES: Invoice[] = [];
const SEED_PAYMENTS: Payment[] = [];

export async function listQuotations() {
  return (await readCollection("quotations.json", SEED_QUOTATIONS)).sort((a, b) =>
    b.quotedAt.localeCompare(a.quotedAt),
  );
}

export async function listSalesOrders() {
  return (await readCollection("sales-orders.json", SEED_ORDERS)).sort((a, b) =>
    b.orderedAt.localeCompare(a.orderedAt),
  );
}

export async function listDeliveries() {
  return (await readCollection("deliveries.json", SEED_DELIVERIES)).sort((a, b) =>
    b.deliveredAt.localeCompare(a.deliveredAt),
  );
}

export async function listInvoices() {
  return (await readCollection("invoices.json", SEED_INVOICES)).sort((a, b) =>
    b.invoicedAt.localeCompare(a.invoicedAt),
  );
}

export async function listPayments() {
  return (await readCollection("payments.json", SEED_PAYMENTS)).sort((a, b) =>
    b.paidAt.localeCompare(a.paidAt),
  );
}

async function resolveLines(
  rawLines: { productId: string; quantity: number; unitPrice?: number }[],
  currency: CurrencyCode,
) {
  if (!rawLines?.length) throw new Error("Au moins une ligne produit est requise");
  const products = await listProducts();
  const lines: SalesLine[] = [];
  for (const raw of rawLines) {
    const product = products.find((p) => p.id === raw.productId);
    if (!product) throw new Error(`Produit introuvable: ${raw.productId}`);
    const qty = Number(raw.quantity);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Quantité invalide pour ${product.sku}`);
    const unitPrice = Number(raw.unitPrice ?? product.wholesalePrice ?? product.sellingPrice);
    const bal = await getStockBalance(product.id, product.warehouseId || "");
    const unitCost = bal?.averageUnitCost ?? product.landedCost;
    lines.push(
      buildSalesLine({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        quantity: qty,
        unitOfMeasure: product.unitOfMeasure,
        unitPrice,
        currency: currency || product.sellingCurrency || "USD",
        unitCost,
      }),
    );
  }
  return lines;
}

export async function createQuotation(input: {
  customerId: string;
  warehouseId: string;
  currency?: CurrencyCode;
  validUntil?: string;
  notes?: string;
  lines: { productId: string; quantity: number; unitPrice?: number }[];
}) {
  const [customers, warehouses, currency] = await Promise.all([
    listCustomers(),
    listWarehouses(),
    getCurrencySettings(),
  ]);
  const customer = customers.find((c) => c.id === input.customerId);
  const warehouse = warehouses.find((w) => w.id === input.warehouseId);
  if (!customer) throw new Error("Client introuvable");
  if (!warehouse) throw new Error("Entrepôt introuvable");

  const cur = (input.currency as CurrencyCode) || "USD";
  const lines = await resolveLines(input.lines, cur);
  // Freeze cost from selected warehouse balances when available
  for (const line of lines) {
    const bal = await getStockBalance(line.productId, warehouse.id);
    if (bal) line.unitCost = bal.averageUnitCost;
    const gp = computeGrossMargin(line.unitPrice, line.unitCost);
    line.grossProfit = money(gp.grossProfit * line.quantity);
    line.marginPct = money(gp.marginPct);
  }

  const now = new Date().toISOString();
  const t = totals(lines);
  const q: Quotation = {
    id: uid("qt"),
    number: await nextNumber("DV-2026", "quotations.json", SEED_QUOTATIONS),
    customerId: customer.id,
    customerName: customer.legalName,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    status: "draft",
    currency: cur,
    exchangeRate: currency.rates[0]?.rate || 1,
    quotedAt: now,
    validUntil: input.validUntil,
    notes: input.notes,
    lines,
    ...t,
    createdAt: now,
    updatedAt: now,
  };
  const all = await listQuotations();
  all.unshift(q);
  await writeCollection("quotations.json", all);
  return q;
}

export async function updateQuotationStatus(
  id: string,
  status: Extract<Quotation["status"], "approved" | "cancelled">,
) {
  const all = await listQuotations();
  const idx = all.findIndex((q) => q.id === id);
  if (idx === -1) throw new Error("Devis introuvable");
  const q = all[idx];
  if (q.status === "cancelled" || q.status === "posted") {
    throw new Error(`Devis ${q.number} déjà ${q.status}`);
  }
  if (status === "approved" && q.status !== "draft") {
    throw new Error("Seuls les brouillons peuvent être approuvés");
  }
  const now = new Date().toISOString();
  all[idx] = {
    ...q,
    status,
    updatedAt: now,
    approvedAt: status === "approved" ? now : q.approvedAt,
  };
  await writeCollection("quotations.json", all);
  return all[idx];
}

export async function convertQuotationToOrder(quotationId: string) {
  const quotations = await listQuotations();
  const idx = quotations.findIndex((q) => q.id === quotationId);
  if (idx === -1) throw new Error("Devis introuvable");
  const q = quotations[idx];
  if (q.status !== "approved") throw new Error("Le devis doit être approuvé avant conversion");
  if (q.salesOrderId) throw new Error("Ce devis a déjà une commande");

  const order = await createSalesOrder({
    customerId: q.customerId,
    warehouseId: q.warehouseId,
    currency: q.currency,
    notes: q.notes,
    quotationId: q.id,
    quotationNumber: q.number,
    lines: q.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      unitCost: l.unitCost,
    })),
  });

  quotations[idx] = {
    ...q,
    status: "posted",
    salesOrderId: order.id,
    updatedAt: new Date().toISOString(),
  };
  await writeCollection("quotations.json", quotations);
  return { quotation: quotations[idx], order };
}

export async function createSalesOrder(input: {
  customerId: string;
  warehouseId: string;
  currency?: CurrencyCode;
  promisedAt?: string;
  notes?: string;
  quotationId?: string;
  quotationNumber?: string;
  lines: { productId: string; quantity: number; unitPrice?: number; unitCost?: number }[];
}) {
  const [customers, warehouses, currency] = await Promise.all([
    listCustomers(),
    listWarehouses(),
    getCurrencySettings(),
  ]);
  const customer = customers.find((c) => c.id === input.customerId);
  const warehouse = warehouses.find((w) => w.id === input.warehouseId);
  if (!customer) throw new Error("Client introuvable");
  if (!warehouse) throw new Error("Entrepôt introuvable");

  const cur = (input.currency as CurrencyCode) || "USD";
  const products = await listProducts();
  const lines: SalesLine[] = [];
  for (const raw of input.lines) {
    const product = products.find((p) => p.id === raw.productId);
    if (!product) throw new Error(`Produit introuvable: ${raw.productId}`);
    const qty = Number(raw.quantity);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Quantité invalide pour ${product.sku}`);
    const bal = await getStockBalance(product.id, warehouse.id);
    const unitCost = Number(raw.unitCost ?? bal?.averageUnitCost ?? product.landedCost);
    const unitPrice = Number(raw.unitPrice ?? product.wholesalePrice ?? product.sellingPrice);
    lines.push(
      buildSalesLine({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        quantity: qty,
        unitOfMeasure: product.unitOfMeasure,
        unitPrice,
        currency: cur,
        unitCost,
      }),
    );
  }

  const now = new Date().toISOString();
  const t = totals(lines);
  const order: SalesOrder = {
    id: uid("so"),
    number: await nextNumber("SO-2026", "sales-orders.json", SEED_ORDERS),
    quotationId: input.quotationId,
    quotationNumber: input.quotationNumber,
    customerId: customer.id,
    customerName: customer.legalName,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    status: "draft",
    currency: cur,
    exchangeRate: currency.rates[0]?.rate || 1,
    orderedAt: now,
    promisedAt: input.promisedAt,
    notes: input.notes,
    lines,
    ...t,
    createdAt: now,
    updatedAt: now,
  };
  const all = await listSalesOrders();
  all.unshift(order);
  await writeCollection("sales-orders.json", all);
  return order;
}

export async function updateSalesOrderStatus(
  id: string,
  status: Extract<SalesOrder["status"], "approved" | "cancelled">,
) {
  const all = await listSalesOrders();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error("Commande introuvable");
  const order = all[idx];
  if (order.status === "cancelled" || order.status === "posted" || order.status === "invoiced") {
    throw new Error(`Commande ${order.number} déjà ${order.status}`);
  }

  if (status === "approved") {
    if (order.status !== "draft") throw new Error("Seuls les brouillons peuvent être approuvés");
    for (const line of order.lines) {
      await reserveStock({
        productId: line.productId,
        warehouseId: order.warehouseId,
        quantity: line.quantity,
      });
    }
  }

  if (status === "cancelled") {
    if (order.status === "approved" || order.status === "partial") {
      for (const line of order.lines) {
        const remaining = line.quantity - line.quantityDelivered;
        if (remaining > 0) {
          await releaseReservation({
            productId: line.productId,
            warehouseId: order.warehouseId,
            quantity: remaining,
          });
        }
      }
    }
  }

  const now = new Date().toISOString();
  all[idx] = {
    ...order,
    status,
    updatedAt: now,
    approvedAt: status === "approved" ? now : order.approvedAt,
  };
  await writeCollection("sales-orders.json", all);
  return all[idx];
}

export async function deliverSalesOrder(input: {
  salesOrderId: string;
  notes?: string;
  lines: { salesLineId: string; quantity: number }[];
}) {
  const all = await listSalesOrders();
  const idx = all.findIndex((o) => o.id === input.salesOrderId);
  if (idx === -1) throw new Error("Commande introuvable");
  const order = all[idx];
  if (order.status !== "approved" && order.status !== "partial") {
    throw new Error("La commande doit être approuvée avant livraison");
  }

  const [warehouses] = await Promise.all([listWarehouses()]);
  const warehouse = warehouses.find((w) => w.id === order.warehouseId);
  if (!warehouse) throw new Error("Entrepôt introuvable");

  const now = new Date().toISOString();
  const deliveryLines: Delivery["lines"] = [];

  for (const recv of input.lines) {
    const line = order.lines.find((l) => l.id === recv.salesLineId);
    if (!line) throw new Error(`Ligne commande introuvable: ${recv.salesLineId}`);
    const qty = Number(recv.quantity);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const remaining = line.quantity - line.quantityDelivered;
    if (qty > remaining + 0.0001) {
      throw new Error(`Quantité trop élevée pour ${line.sku}: reste ${remaining}`);
    }

    const product = await getProduct(line.productId);
    if (!product) throw new Error(`Produit ${line.sku} introuvable`);

    // Freeze cost at delivery from current average (or keep SO frozen cost)
    const unitCost = line.unitCost;

    await applyStockDelta({
      type: "sales_issue",
      product,
      warehouse,
      quantity: qty,
      quantityDelta: -qty,
      unitCost,
      currency: line.currency,
      referenceType: "sales_order",
      referenceId: order.id,
      referenceNumber: order.number,
      reason: `Livraison ${order.number}`,
      releaseReserved: qty,
    });

    line.quantityDelivered = money(line.quantityDelivered + qty);
    deliveryLines.push({
      id: uid("dl"),
      salesLineId: line.id,
      productId: line.productId,
      sku: line.sku,
      productName: line.productName,
      quantity: qty,
      unitOfMeasure: line.unitOfMeasure,
      unitPrice: line.unitPrice,
      unitCost,
      currency: line.currency,
    });
  }

  if (deliveryLines.length === 0) throw new Error("Aucune quantité valide à livrer");

  const allDelivered = order.lines.every((l) => l.quantityDelivered >= l.quantity - 0.0001);
  order.status = allDelivered ? "posted" : "partial";
  order.updatedAt = now;
  if (allDelivered) order.postedAt = now;
  all[idx] = order;
  await writeCollection("sales-orders.json", all);

  const delivery: Delivery = {
    id: uid("dn"),
    number: await nextNumber("BL-2026", "deliveries.json", SEED_DELIVERIES),
    salesOrderId: order.id,
    salesOrderNumber: order.number,
    customerId: order.customerId,
    customerName: order.customerName,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    status: "posted",
    deliveredAt: now,
    notes: input.notes,
    lines: deliveryLines,
    createdAt: now,
    updatedAt: now,
    postedAt: now,
  };
  const deliveries = await listDeliveries();
  deliveries.unshift(delivery);
  await writeCollection("deliveries.json", deliveries);
  return { salesOrder: order, delivery };
}

export async function invoiceDelivery(deliveryId: string, dueAt?: string) {
  const deliveries = await listDeliveries();
  const dIdx = deliveries.findIndex((d) => d.id === deliveryId);
  if (dIdx === -1) throw new Error("Livraison introuvable");
  const delivery = deliveries[dIdx];
  if (delivery.status !== "posted") throw new Error("Livraison non postée");
  if (delivery.invoiceId) throw new Error("Cette livraison est déjà facturée");

  const orders = await listSalesOrders();
  const order = orders.find((o) => o.id === delivery.salesOrderId);
  if (!order) throw new Error("Commande liée introuvable");

  const currency = await getCurrencySettings();
  const now = new Date().toISOString();
  const lines = delivery.lines.map((l) => {
    const lineTotal = money(l.quantity * l.unitPrice);
    const gp = computeGrossMargin(l.unitPrice, l.unitCost);
    return {
      id: uid("il"),
      productId: l.productId,
      sku: l.sku,
      productName: l.productName,
      quantity: l.quantity,
      unitOfMeasure: l.unitOfMeasure,
      unitPrice: l.unitPrice,
      unitCost: l.unitCost,
      currency: l.currency,
      lineTotal,
      grossProfit: money(gp.grossProfit * l.quantity),
      marginPct: money(gp.marginPct),
    };
  });
  const subtotal = money(lines.reduce((s, l) => s + l.lineTotal, 0));
  const totalCost = money(lines.reduce((s, l) => s + l.unitCost * l.quantity, 0));
  const grossProfit = money(subtotal - totalCost);
  const marginPct = subtotal > 0 ? money((grossProfit / subtotal) * 100) : 0;

  const invoice: Invoice = {
    id: uid("inv"),
    number: await nextNumber("FA-2026", "invoices.json", SEED_INVOICES),
    salesOrderId: order.id,
    salesOrderNumber: order.number,
    deliveryId: delivery.id,
    deliveryNumber: delivery.number,
    customerId: delivery.customerId,
    customerName: delivery.customerName,
    status: "posted",
    currency: order.currency,
    exchangeRate: order.exchangeRate || currency.rates[0]?.rate || 1,
    invoicedAt: now,
    dueAt,
    lines,
    subtotal,
    totalCost,
    grossProfit,
    marginPct,
    amountPaid: 0,
    balanceDue: subtotal,
    createdAt: now,
    updatedAt: now,
    postedAt: now,
  };

  const invoices = await listInvoices();
  invoices.unshift(invoice);
  await writeCollection("invoices.json", invoices);

  deliveries[dIdx] = { ...delivery, invoiceId: invoice.id, updatedAt: now };
  await writeCollection("deliveries.json", deliveries);

  // Mark SO invoiced when fully delivered and all deliveries invoiced (simple: when SO posted)
  if (order.status === "posted") {
    const oIdx = orders.findIndex((o) => o.id === order.id);
    if (oIdx !== -1) {
      orders[oIdx] = { ...orders[oIdx], status: "invoiced", updatedAt: now };
      await writeCollection("sales-orders.json", orders);
    }
  }

  return invoice;
}

export async function recordPayment(input: {
  invoiceId: string;
  amount: number;
  method: Payment["method"];
  paidAt?: string;
  notes?: string;
}) {
  const invoices = await listInvoices();
  const idx = invoices.findIndex((i) => i.id === input.invoiceId);
  if (idx === -1) throw new Error("Facture introuvable");
  const invoice = invoices[idx];
  if (invoice.status === "cancelled") throw new Error("Facture annulée");
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Montant invalide");
  if (amount > invoice.balanceDue + 0.0001) {
    throw new Error(`Montant supérieur au solde dû (${invoice.balanceDue})`);
  }

  const now = new Date().toISOString();
  const payment: Payment = {
    id: uid("pay"),
    number: await nextNumber("PA-2026", "payments.json", SEED_PAYMENTS),
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    amount,
    currency: invoice.currency,
    exchangeRate: invoice.exchangeRate,
    method: input.method,
    paidAt: input.paidAt || now,
    notes: input.notes,
    createdAt: now,
  };
  const payments = await listPayments();
  payments.unshift(payment);
  await writeCollection("payments.json", payments);

  const amountPaid = money(invoice.amountPaid + amount);
  const balanceDue = money(invoice.subtotal - amountPaid);
  invoices[idx] = {
    ...invoice,
    amountPaid,
    balanceDue,
    status: balanceDue <= 0.0001 ? "paid" : "partial",
    updatedAt: now,
  };
  await writeCollection("invoices.json", invoices);
  return { payment, invoice: invoices[idx] };
}

export async function getSalesDashboard() {
  const [quotations, orders, deliveries, invoices, payments] = await Promise.all([
    listQuotations(),
    listSalesOrders(),
    listDeliveries(),
    listInvoices(),
    listPayments(),
  ]);
  const openOrders = orders.filter((o) =>
    ["draft", "approved", "partial"].includes(o.status),
  ).length;
  const arBalance = invoices.reduce((s, i) => s + Math.max(0, i.balanceDue), 0);
  const salesPosted = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((s, i) => s + i.subtotal, 0);
  const margin = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((s, i) => s + i.grossProfit, 0);
  return {
    counts: {
      quotations: quotations.length,
      orders: orders.length,
      openOrders,
      deliveries: deliveries.length,
      invoices: invoices.length,
      payments: payments.length,
    },
    arBalanceUsd: money(arBalance),
    salesInvoicedUsd: money(salesPosted),
    grossProfitUsd: money(margin),
  };
}
