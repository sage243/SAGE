"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Product, PurchaseOrder, Supplier, Warehouse } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LineDraft = {
  productId: string;
  quantityOrdered: string;
  unitPrice: string;
};

const emptyLine = (): LineDraft => ({ productId: "", quantityOrdered: "1", unitPrice: "" });

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  approved: "Approuvé",
  partial: "Réception partielle",
  posted: "Soldé",
  cancelled: "Annulé",
};

export function PurchasesManager() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});

  const productOptions = useMemo(
    () => products.filter((p) => p.kind === "product" && p.status === "active"),
    [products],
  );

  async function load() {
    const [poRes, supRes, whRes, prRes] = await Promise.all([
      fetch("/api/purchases"),
      fetch("/api/suppliers"),
      fetch("/api/warehouses"),
      fetch("/api/products-master"),
    ]);
    if (poRes.ok) setOrders(await poRes.json());
    if (supRes.ok) {
      const s = (await supRes.json()) as Supplier[];
      setSuppliers(s);
      setSupplierId((prev) => prev || s.find((x) => x.id === "sup_beltexco_01")?.id || s[0]?.id || "");
    }
    if (whRes.ok) {
      const w = (await whRes.json()) as Warehouse[];
      setWarehouses(w);
      setWarehouseId((prev) => prev || w.find((x) => x.id === "wh_limete_01")?.id || w[0]?.id || "");
    }
    if (prRes.ok) setProducts(await prRes.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const payloadLines = lines
      .filter((l) => l.productId && Number(l.quantityOrdered) > 0)
      .map((l) => ({
        productId: l.productId,
        quantityOrdered: Number(l.quantityOrdered),
        unitPrice: l.unitPrice === "" ? undefined : Number(l.unitPrice),
      }));
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        supplierId,
        warehouseId,
        notes: notes || undefined,
        expectedAt: expectedAt || undefined,
        lines: payloadLines,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Création impossible");
      return;
    }
    setLines([emptyLine()]);
    setNotes("");
    setExpectedAt("");
    setMessage("Bon de commande créé (brouillon)");
    await load();
  }

  async function setStatus(id: string, status: "approved" | "cancelled") {
    setBusy(true);
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", id, status }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Changement de statut impossible");
      return;
    }
    setMessage(status === "approved" ? "BC approuvé" : "BC annulé");
    await load();
  }

  async function receiveAll(po: PurchaseOrder) {
    setBusy(true);
    const linesPayload = po.lines
      .map((l) => {
        const key = `${po.id}:${l.id}`;
        const remaining = l.quantityOrdered - l.quantityReceived;
        const typed = receiveQty[key];
        const qty = typed !== undefined && typed !== "" ? Number(typed) : remaining;
        return { purchaseLineId: l.id, quantityReceived: qty };
      })
      .filter((l) => l.quantityReceived > 0);

    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "receive",
        purchaseOrderId: po.id,
        lines: linesPayload,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Réception impossible");
      return;
    }
    setMessage(`Réception enregistrée pour ${po.number}`);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Achats</h1>
        <p className="mt-2 text-sm text-sand/65">
          Bons de commande fournisseur → approbation → réception marchandises (stock + coût réel).
        </p>
      </div>

      <form onSubmit={onCreate} className="space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sand/80">Fournisseur</Label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.legalName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sand/80">Entrepôt de réception</Label>
            <select
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sand/80">Date prévue</Label>
            <Input
              type="date"
              value={expectedAt}
              onChange={(e) => setExpectedAt(e.target.value)}
              className="border-white/15 bg-[#0b2a18] text-sand"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sand/80">Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-white/15 bg-[#0b2a18] text-sand"
              placeholder="Réassort alimentation…"
            />
          </div>
        </div>

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
                    unitPrice: product ? String(product.purchasePrice) : next[idx].unitPrice,
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
                value={line.quantityOrdered}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], quantityOrdered: e.target.value };
                  setLines(next);
                }}
                placeholder="Qté"
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
                placeholder="Prix unit. USD"
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

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy} className="bg-copper text-accent-foreground">
            Créer le BC
          </Button>
          {message && <p className="self-center text-sm text-sand/60">{message}</p>}
        </div>
      </form>

      <div className="space-y-4">
        {orders.map((po) => (
          <div key={po.id} className="border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-white">
                  {po.number} · {statusLabel[po.status] || po.status}
                </p>
                <p className="text-sm text-sand/60">
                  {po.supplierName} → {po.warehouseName} · {po.subtotal.toFixed(2)} {po.currency} HT · coût
                  réel {po.totalLanded.toFixed(2)} {po.currency}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {po.status === "draft" && (
                  <Button
                    size="sm"
                    disabled={busy}
                    className="bg-copper text-accent-foreground"
                    onClick={() => void setStatus(po.id, "approved")}
                  >
                    Approuver
                  </Button>
                )}
                {(po.status === "draft" || po.status === "approved" || po.status === "partial") && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="border-white/20 bg-transparent text-sand"
                    onClick={() => void setStatus(po.id, "cancelled")}
                  >
                    Annuler
                  </Button>
                )}
                {(po.status === "approved" || po.status === "partial") && (
                  <Button
                    size="sm"
                    disabled={busy}
                    className="bg-copper text-accent-foreground"
                    onClick={() => void receiveAll(po)}
                  >
                    Réceptionner
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {po.lines.map((l) => {
                const remaining = l.quantityOrdered - l.quantityReceived;
                const key = `${po.id}:${l.id}`;
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
                        Commandé {l.quantityOrdered} · reçu {l.quantityReceived} · reste {remaining}{" "}
                        {l.unitOfMeasure} · {l.landedUnitCost.toFixed(2)} {l.currency}/u coût réel
                      </p>
                    </div>
                    {(po.status === "approved" || po.status === "partial") && remaining > 0 && (
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        step="0.01"
                        placeholder={String(remaining)}
                        value={receiveQty[key] ?? ""}
                        onChange={(e) => setReceiveQty({ ...receiveQty, [key]: e.target.value })}
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
    </div>
  );
}
