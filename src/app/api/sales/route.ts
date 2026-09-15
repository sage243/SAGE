import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import {
  convertQuotationToOrder,
  createQuotation,
  createSalesOrder,
  deliverSalesOrder,
  getSalesDashboard,
  invoiceDelivery,
  listDeliveries,
  listInvoices,
  listPayments,
  listQuotations,
  listSalesOrders,
  recordPayment,
  updateQuotationStatus,
  updateSalesOrderStatus,
} from "@/lib/sales";
import type { CurrencyCode, Payment } from "@/lib/domain";

export async function GET(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const view = new URL(request.url).searchParams.get("view") || "orders";
  if (view === "quotations") return NextResponse.json(await listQuotations());
  if (view === "deliveries") return NextResponse.json(await listDeliveries());
  if (view === "invoices") return NextResponse.json(await listInvoices());
  if (view === "payments") return NextResponse.json(await listPayments());
  if (view === "dashboard") return NextResponse.json(await getSalesDashboard());
  return NextResponse.json(await listSalesOrders());
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "create_quotation") {
      const q = await createQuotation({
        customerId: String(body.customerId),
        warehouseId: String(body.warehouseId),
        currency: body.currency as CurrencyCode | undefined,
        validUntil: body.validUntil || undefined,
        notes: body.notes || undefined,
        lines: body.lines,
      });
      return NextResponse.json(q, { status: 201 });
    }

    if (action === "quotation_status") {
      const q = await updateQuotationStatus(String(body.id), body.status);
      return NextResponse.json(q);
    }

    if (action === "convert_quotation") {
      const result = await convertQuotationToOrder(String(body.quotationId));
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "create_order") {
      const order = await createSalesOrder({
        customerId: String(body.customerId),
        warehouseId: String(body.warehouseId),
        currency: body.currency as CurrencyCode | undefined,
        promisedAt: body.promisedAt || undefined,
        notes: body.notes || undefined,
        lines: body.lines,
      });
      return NextResponse.json(order, { status: 201 });
    }

    if (action === "order_status") {
      const order = await updateSalesOrderStatus(String(body.id), body.status);
      return NextResponse.json(order);
    }

    if (action === "deliver") {
      const result = await deliverSalesOrder({
        salesOrderId: String(body.salesOrderId),
        notes: body.notes || undefined,
        lines: body.lines,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "invoice") {
      const invoice = await invoiceDelivery(String(body.deliveryId), body.dueAt || undefined);
      return NextResponse.json(invoice, { status: 201 });
    }

    if (action === "payment") {
      const result = await recordPayment({
        invoiceId: String(body.invoiceId),
        amount: Number(body.amount),
        method: body.method as Payment["method"],
        paidAt: body.paidAt || undefined,
        notes: body.notes || undefined,
      });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur ventes";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
