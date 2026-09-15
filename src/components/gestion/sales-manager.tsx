"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  Customer,
  Delivery,
  Invoice,
  Product,
  Quotation,
  SalesOrder,
  Warehouse,
} from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "devis" | "commandes" | "livraisons" | "factures";

type LineDraft = { productId: string; quantity: string; unitPrice: string };
const emptyLine = (): LineDraft => ({ productId: "", quantity: "1", unitPrice: "" });

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  approved: "Approuvé",
  partial: "Partiel",
  posted: "Soldé / Posté",
  cancelled: "Annulé",
  invoiced: "Facturé",
  paid: "Payé",
};

export function SalesManager() {
  const [tab, setTab] = useState<Tab>("devis");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [deliverQty, setDeliverQty] = useState<Record<string, string>>({});
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});

  const productOptions = useMemo(
    () => products.filter((p) => p.kind === "product" && p.status === "active"),
    [products],
  );

  async function load() {
    const [q, o, d, i, c, w, p] = await Promise.all([
      fetch("/api/sales?view=quotations"),
      fetch("/api/sales?view=orders"),
      fetch("/api/sales?view=deliveries"),
      fetch("/api/sales?view=invoices"),
      fetch("/api/customers"),
      fetch("/api/warehouses"),
      fetch("/api/products-master"),
    ]);
    if (q.ok) setQuotations(await q.json());
    if (o.ok) setOrders(await o.json());
    if (d.ok) setDeliveries(await d.json());
    if (i.ok) setInvoices(await i.json());
    if (c.ok) {
      const list = (await c.json()) as Customer[];
      setCustomers(list);
      setCustomerId((prev) => prev || list[0]?.id || "");
    }
    if (w.ok) {
      const list = (await w.json()) as Warehouse[];
      setWarehouses(list);
      setWarehouseId((prev) => prev || list.find((x) => x.isDefault)?.id || list[0]?.id || "");
    }
    if (p.ok) setProducts(await p.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Échec");
      return null;
    }
    return res.json();
  }

  async function onCreateQuotation(e: FormEvent) {
    e.preventDefault();
    const payloadLines = lines
      .filter((l) => l.productId && Number(l.quantity) > 0)
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitPrice: l.unitPrice === "" ? undefined : Number(l.unitPrice),
      }));
    const data = await post({
      action: "create_quotation",
      customerId,
      warehouseId,
      notes: notes || undefined,
      lines: payloadLines,
    });
    if (!data) return;
    setLines([emptyLine()]);
    setNotes("");
    setMessage(`Devis ${data.number} créé`);
    setTab("devis");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Ventes</h1>
        <p className="mt-2 text-sm text-sand/65">
          Devis → commande (réservation stock) → livraison (sortie stock + coût figé) → facture →
          paiement.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["devis", "Devis"],
            ["commandes", "Commandes"],
            ["livraisons", "Livraisons"],
            ["factures", "Factures"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            type="button"
            variant={tab === id ? "default" : "outline"}
            className={
              tab === id ? "bg-copper text-accent-foreground" : "border-white/20 bg-transparent text-sand"
            }
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {message && <p className="text-sm text-sand/70">{message}</p>}

      {tab === "devis" && (
        <div className="space-y-6">
          <form onSubmit={onCreateQuotation} className="space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Client"
                value={customerId}
                onChange={setCustomerId}
                options={customers.map((c) => ({ value: c.id, label: `${c.code} · ${c.legalName}` }))}
              />
              <SelectField
                label="Entrepôt"
                value={warehouseId}
                onChange={setWarehouseId}
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              />
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sand/80">Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-white/15 bg-[#0b2a18] text-sand"
                  placeholder="Commande hôtel / cantine…"
                />
              </div>
            </div>
            <LineEditor lines={lines} setLines={setLines} productOptions={productOptions} />
            <Button type="submit" disabled={busy} className="bg-copper text-accent-foreground">
              Créer le devis
            </Button>
          </form>

          <div className="space-y-3">
            {quotations.map((q) => (
              <div key={q.id} className="border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {q.number} · {statusLabel[q.status] || q.status}
                    </p>
                    <p className="text-sm text-sand/60">
                      {q.customerName} · {q.subtotal.toFixed(2)} {q.currency} · marge{" "}
                      {q.marginPct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q.status === "draft" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        className="bg-copper text-accent-foreground"
                        onClick={async () => {
                          const data = await post({ action: "quotation_status", id: q.id, status: "approved" });
                          if (data) {
                            setMessage(`Devis ${q.number} approuvé`);
                            await load();
                          }
                        }}
                      >
                        Approuver
                      </Button>
                    )}
                    {q.status === "approved" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        className="bg-copper text-accent-foreground"
                        onClick={async () => {
                          const data = await post({ action: "convert_quotation", quotationId: q.id });
                          if (data) {
                            setMessage(`Commande ${data.order.number} créée`);
                            setTab("commandes");
                            await load();
                          }
                        }}
                      >
                        Convertir en commande
                      </Button>
                    )}
                  </div>
                </div>
                <LinesPreview lines={q.lines} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "commandes" && (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div>
                  <p className="font-medium text-white">
                    {o.number} · {statusLabel[o.status] || o.status}
                    {o.quotationNumber ? ` · via ${o.quotationNumber}` : ""}
                  </p>
                  <p className="text-sm text-sand/60">
                    {o.customerName} → {o.warehouseName} · {o.subtotal.toFixed(2)} {o.currency} · profit{" "}
                    {o.grossProfit.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.status === "draft" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      className="bg-copper text-accent-foreground"
                      onClick={async () => {
                        const data = await post({ action: "order_status", id: o.id, status: "approved" });
                        if (data) {
                          setMessage(`Commande ${o.number} approuvée (stock réservé)`);
                          await load();
                        }
                      }}
                    >
                      Approuver + réserver
                    </Button>
                  )}
                  {(o.status === "approved" || o.status === "partial") && (
                    <Button
                      size="sm"
                      disabled={busy}
                      className="bg-copper text-accent-foreground"
                      onClick={async () => {
                        const payload = o.lines
                          .map((l) => {
                            const key = `${o.id}:${l.id}`;
                            const remaining = l.quantity - l.quantityDelivered;
                            const typed = deliverQty[key];
                            const qty =
                              typed !== undefined && typed !== "" ? Number(typed) : remaining;
                            return { salesLineId: l.id, quantity: qty };
                          })
                          .filter((l) => l.quantity > 0);
                        const data = await post({
                          action: "deliver",
                          salesOrderId: o.id,
                          lines: payload,
                        });
                        if (data) {
                          setMessage(`Livraison ${data.delivery.number} postée`);
                          setTab("livraisons");
                          await load();
                        }
                      }}
                    >
                      Livrer
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {o.lines.map((l) => {
                  const remaining = l.quantity - l.quantityDelivered;
                  const key = `${o.id}:${l.id}`;
                  return (
                    <div
                      key={l.id}
                      className="grid gap-2 border border-white/5 bg-black/20 px-3 py-2 text-sm sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="text-sand">
                          {l.sku} · {l.productName}
                        </p>
                        <p className="text-sand/50">
                          Cmd {l.quantity} · livré {l.quantityDelivered} · reste {remaining} · prix{" "}
                          {l.unitPrice.toFixed(2)} · coût figé {l.unitCost.toFixed(2)} · marge{" "}
                          {l.marginPct.toFixed(1)}%
                        </p>
                      </div>
                      {(o.status === "approved" || o.status === "partial") && remaining > 0 && (
                        <Input
                          type="number"
                          min="0"
                          max={remaining}
                          step="0.01"
                          placeholder={String(remaining)}
                          value={deliverQty[key] ?? ""}
                          onChange={(e) => setDeliverQty({ ...deliverQty, [key]: e.target.value })}
                          className="h-8 w-28 border-white/15 bg-[#0b2a18] text-sand"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "livraisons" && (
        <div className="space-y-3">
          {deliveries.length === 0 ? (
            <p className="text-sm text-sand/55">Aucune livraison.</p>
          ) : (
            deliveries.map((d) => (
              <div key={d.id} className="border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {d.number} · {d.salesOrderNumber} · {statusLabel[d.status] || d.status}
                    </p>
                    <p className="text-sm text-sand/60">
                      {d.customerName} · {d.lines.length} ligne(s)
                      {d.invoiceId ? " · déjà facturée" : ""}
                    </p>
                  </div>
                  {!d.invoiceId && d.status === "posted" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      className="bg-copper text-accent-foreground"
                      onClick={async () => {
                        const data = await post({ action: "invoice", deliveryId: d.id });
                        if (data) {
                          setMessage(`Facture ${data.number} créée`);
                          setTab("factures");
                          await load();
                        }
                      }}
                    >
                      Facturer
                    </Button>
                  )}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-sand/70">
                  {d.lines.map((l) => (
                    <li key={l.id}>
                      {l.sku} · {l.quantity} {l.unitOfMeasure} · {l.unitPrice.toFixed(2)} (coût{" "}
                      {l.unitCost.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "factures" && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-sm text-sand/55">Aucune facture.</p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {inv.number} · {statusLabel[inv.status] || inv.status}
                    </p>
                    <p className="text-sm text-sand/60">
                      {inv.customerName} · HT {inv.subtotal.toFixed(2)} {inv.currency} · profit{" "}
                      {inv.grossProfit.toFixed(2)} ({inv.marginPct.toFixed(1)}%) · dû{" "}
                      {inv.balanceDue.toFixed(2)}
                    </p>
                  </div>
                  {inv.balanceDue > 0 && inv.status !== "cancelled" && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder={String(inv.balanceDue)}
                        value={payAmount[inv.id] ?? ""}
                        onChange={(e) => setPayAmount({ ...payAmount, [inv.id]: e.target.value })}
                        className="h-8 w-28 border-white/15 bg-[#0b2a18] text-sand"
                      />
                      <Button
                        size="sm"
                        disabled={busy}
                        className="bg-copper text-accent-foreground"
                        onClick={async () => {
                          const amount =
                            payAmount[inv.id] && payAmount[inv.id] !== ""
                              ? Number(payAmount[inv.id])
                              : inv.balanceDue;
                          const data = await post({
                            action: "payment",
                            invoiceId: inv.id,
                            amount,
                            method: "mobile_money",
                          });
                          if (data) {
                            setMessage(`Paiement ${data.payment.number} enregistré`);
                            await load();
                          }
                        }}
                      >
                        Encaisser
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sand/80">{label}</Label>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LineEditor({
  lines,
  setLines,
  productOptions,
}: {
  lines: LineDraft[];
  setLines: (lines: LineDraft[]) => void;
  productOptions: Product[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-sand/80">Lignes</p>
      {lines.map((line, idx) => (
        <div key={idx} className="grid gap-2 sm:grid-cols-3">
          <select
            required
            value={line.productId}
            onChange={(e) => {
              const next = [...lines];
              const product = productOptions.find((p) => p.id === e.target.value);
              next[idx] = {
                ...next[idx],
                productId: e.target.value,
                unitPrice: product ? String(product.wholesalePrice || product.sellingPrice) : next[idx].unitPrice,
              };
              setLines(next);
            }}
            className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
          >
            <option value="">Produit…</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.name}
              </option>
            ))}
          </select>
          <Input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={line.quantity}
            onChange={(e) => {
              const next = [...lines];
              next[idx] = { ...next[idx], quantity: e.target.value };
              setLines(next);
            }}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={line.unitPrice}
            onChange={(e) => {
              const next = [...lines];
              next[idx] = { ...next[idx], unitPrice: e.target.value };
              setLines(next);
            }}
            placeholder="Prix vente"
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="border-white/20 bg-transparent text-sand"
        onClick={() => setLines([...lines, emptyLine()])}
      >
        Ajouter une ligne
      </Button>
    </div>
  );
}

function LinesPreview({
  lines,
}: {
  lines: { sku: string; productName: string; quantity: number; unitPrice: number; unitCost: number; marginPct: number }[];
}) {
  return (
    <ul className="mt-3 space-y-1 text-sm text-sand/65">
      {lines.map((l, i) => (
        <li key={i}>
          {l.sku} · {l.quantity} × {l.unitPrice.toFixed(2)} (coût {l.unitCost.toFixed(2)}, marge{" "}
          {l.marginPct.toFixed(1)}%)
        </li>
      ))}
    </ul>
  );
}
