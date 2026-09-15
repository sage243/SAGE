import { DIVISIONS } from "./divisions";
import { getCurrencySettings, listProducts, listSuppliers } from "./masters";
import { listPurchaseOrders } from "./procurement";
import { listInvoices, listPayments, listSalesOrders } from "./sales";
import { listStockBalances } from "./inventory";

function money(n: number) {
  return Number(Number(n || 0).toFixed(2));
}

export type ProfitRow = {
  key: string;
  label: string;
  secondary?: string;
  quantity: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPct: number;
  invoiceCount: number;
};

export async function getProfitabilityReport() {
  const [invoices, products, currency] = await Promise.all([
    listInvoices(),
    listProducts(),
    getCurrencySettings(),
  ]);

  const posted = invoices.filter((i) => i.status !== "cancelled");
  const byProduct = new Map<string, ProfitRow>();
  const byCustomer = new Map<string, ProfitRow>();
  const byActivity = new Map<string, ProfitRow>();

  const productActivity = new Map(products.map((p) => [p.id, p.activity]));

  for (const inv of posted) {
    // customer rollup
    const cust = byCustomer.get(inv.customerId) || {
      key: inv.customerId,
      label: inv.customerName,
      quantity: 0,
      revenue: 0,
      cost: 0,
      grossProfit: 0,
      marginPct: 0,
      invoiceCount: 0,
    };
    cust.invoiceCount += 1;
    cust.revenue += inv.subtotal;
    cust.cost += inv.totalCost;
    cust.grossProfit += inv.grossProfit;
    byCustomer.set(inv.customerId, cust);

    for (const line of inv.lines) {
      const revenue = line.lineTotal;
      const cost = line.unitCost * line.quantity;
      const gp = revenue - cost;

      const prod = byProduct.get(line.productId) || {
        key: line.productId,
        label: line.productName,
        secondary: line.sku,
        quantity: 0,
        revenue: 0,
        cost: 0,
        grossProfit: 0,
        marginPct: 0,
        invoiceCount: 0,
      };
      prod.quantity += line.quantity;
      prod.revenue += revenue;
      prod.cost += cost;
      prod.grossProfit += gp;
      prod.invoiceCount += 1;
      byProduct.set(line.productId, prod);

      const activitySlug = productActivity.get(line.productId) || "commerce-general";
      const division = DIVISIONS.find((d) => d.slug === activitySlug);
      const act = byActivity.get(activitySlug) || {
        key: activitySlug,
        label: division?.name || activitySlug,
        secondary: activitySlug,
        quantity: 0,
        revenue: 0,
        cost: 0,
        grossProfit: 0,
        marginPct: 0,
        invoiceCount: 0,
      };
      act.quantity += line.quantity;
      act.revenue += revenue;
      act.cost += cost;
      act.grossProfit += gp;
      act.invoiceCount += 1;
      byActivity.set(activitySlug, act);
    }
  }

  const finalize = (rows: ProfitRow[]) =>
    rows
      .map((r) => ({
        ...r,
        revenue: money(r.revenue),
        cost: money(r.cost),
        grossProfit: money(r.grossProfit),
        marginPct: r.revenue > 0 ? money((r.grossProfit / r.revenue) * 100) : 0,
        quantity: money(r.quantity),
      }))
      .sort((a, b) => b.grossProfit - a.grossProfit);

  const productRows = finalize([...byProduct.values()]);
  const customerRows = finalize([...byCustomer.values()]);
  const activityRows = finalize([...byActivity.values()]);

  const totals = {
    revenue: money(productRows.reduce((s, r) => s + r.revenue, 0)),
    cost: money(productRows.reduce((s, r) => s + r.cost, 0)),
    grossProfit: money(productRows.reduce((s, r) => s + r.grossProfit, 0)),
    marginPct: 0,
    invoiceCount: posted.length,
  };
  totals.marginPct = totals.revenue > 0 ? money((totals.grossProfit / totals.revenue) * 100) : 0;

  // Catalog theoretical margin (not yet sold) — for assortment steering
  const catalogMargins = products
    .filter((p) => p.status === "active" && p.kind === "product" && p.sellingPrice > 0)
    .map((p) => {
      const gp = p.sellingPrice - p.landedCost;
      return {
        key: p.id,
        sku: p.sku,
        label: p.name,
        activity: p.activity,
        landedCost: money(p.landedCost),
        sellingPrice: money(p.sellingPrice),
        wholesalePrice: money(p.wholesalePrice),
        grossProfit: money(gp),
        marginPct: money((gp / p.sellingPrice) * 100),
        quantityOnHand: p.quantityOnHand,
      };
    })
    .sort((a, b) => b.marginPct - a.marginPct);

  const fx = currency.rates[0]?.rate || 1;

  return {
    baseCurrency: currency.baseCurrency,
    fxUsdToCdf: fx,
    totals,
    byProduct: productRows,
    byCustomer: customerRows,
    byActivity: activityRows,
    catalogMargins: catalogMargins.slice(0, 25),
    lowMarginCatalog: catalogMargins.filter((c) => c.marginPct < 8).slice(0, 15),
  };
}

/** Phase 5 — consolidated management KPIs */
export async function getManagementDashboard() {
  const [
    profitability,
    invoices,
    payments,
    salesOrders,
    purchaseOrders,
    suppliers,
    balances,
    currency,
    products,
  ] = await Promise.all([
    getProfitabilityReport(),
    listInvoices(),
    listPayments(),
    listSalesOrders(),
    listPurchaseOrders(),
    listSuppliers(),
    listStockBalances(),
    getCurrencySettings(),
    listProducts(),
  ]);

  const fx = currency.rates[0]?.rate || 1;
  const toCdf = (usd: number) => money(usd * fx);

  const arUsd = money(
    invoices.filter((i) => i.status !== "cancelled").reduce((s, i) => s + Math.max(0, i.balanceDue), 0),
  );
  const cashCollectedUsd = money(payments.reduce((s, p) => s + p.amount, 0));

  // AP approximation: open/partial POs totalLanded remaining + supplier outstanding balances
  const openPoAp = purchaseOrders
    .filter((p) => p.status === "approved" || p.status === "partial" || p.status === "draft")
    .reduce((s, p) => {
      const receivedRatio =
        p.lines.reduce((a, l) => a + l.quantityReceived, 0) /
        Math.max(
          p.lines.reduce((a, l) => a + l.quantityOrdered, 0),
          1,
        );
      // unpaid estimate: full landed for draft/approved; remaining for partial
      if (p.status === "partial") return s + p.totalLanded * (1 - Math.min(receivedRatio, 1));
      return s + p.totalLanded;
    }, 0);
  const supplierBalances = suppliers.reduce((s, x) => s + Math.max(0, x.outstandingBalance || 0), 0);
  const apUsd = money(openPoAp + supplierBalances);

  const inventoryUsd = money(
    balances.reduce((s, b) => s + b.quantityOnHand * b.averageUnitCost, 0),
  );
  const reservedUsd = money(
    balances.reduce((s, b) => s + (b.quantityReserved || 0) * b.averageUnitCost, 0),
  );

  const openSales = salesOrders.filter((o) =>
    ["draft", "approved", "partial"].includes(o.status),
  ).length;
  const openPurchases = purchaseOrders.filter((p) =>
    ["draft", "approved", "partial"].includes(p.status),
  ).length;

  const lowStock = products.filter(
    (p) => p.kind === "product" && p.reorderLevel > 0 && p.quantityOnHand <= p.reorderLevel,
  ).length;

  const netWorkingCapitalUsd = money(inventoryUsd + arUsd - apUsd);
  const cashPositionUsd = money(cashCollectedUsd); // MVP: collected cash only (no opening bank)

  return {
    asOf: new Date().toISOString(),
    baseCurrency: currency.baseCurrency,
    fxUsdToCdf: fx,
    kpis: {
      salesInvoicedUsd: profitability.totals.revenue,
      salesInvoicedCdf: toCdf(profitability.totals.revenue),
      grossProfitUsd: profitability.totals.grossProfit,
      grossProfitCdf: toCdf(profitability.totals.grossProfit),
      marginPct: profitability.totals.marginPct,
      inventoryUsd,
      inventoryCdf: toCdf(inventoryUsd),
      reservedInventoryUsd: reservedUsd,
      arUsd,
      arCdf: toCdf(arUsd),
      apUsd,
      apCdf: toCdf(apUsd),
      cashCollectedUsd,
      cashCollectedCdf: toCdf(cashCollectedUsd),
      netWorkingCapitalUsd,
      netWorkingCapitalCdf: toCdf(netWorkingCapitalUsd),
      cashPositionUsd,
      cashPositionCdf: toCdf(cashPositionUsd),
    },
    counts: {
      openSalesOrders: openSales,
      openPurchaseOrders: openPurchases,
      invoices: invoices.filter((i) => i.status !== "cancelled").length,
      payments: payments.length,
      lowStock,
      customersWithSales: profitability.byCustomer.length,
    },
    topProducts: profitability.byProduct.slice(0, 5),
    topCustomers: profitability.byCustomer.slice(0, 5),
    byActivity: profitability.byActivity,
  };
}
