"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Product, StockBalance, StockMovement, Warehouse } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

const moveLabel: Record<string, string> = {
  purchase_receipt: "Réception achat",
  sales_issue: "Sortie vente",
  transfer_in: "Transfert entrant",
  transfer_out: "Transfert sortant",
  adjustment: "Ajustement",
  loss: "Perte / casse",
  recipe_consumption: "Conso. recette",
  opening: "Stock d’ouverture",
};

export function StockManager() {
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tab, setTab] = useState<"balances" | "movements">("balances");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    warehouseId: "",
    quantity: "1",
    direction: "in" as "in" | "out" | "loss",
    reason: "",
  });

  const productOptions = useMemo(
    () => products.filter((p) => p.kind === "product" && p.status === "active"),
    [products],
  );

  async function load() {
    const [bRes, mRes, pRes, wRes] = await Promise.all([
      fetch("/api/stock?view=balances"),
      fetch("/api/stock?view=movements"),
      fetch("/api/products-master"),
      fetch("/api/warehouses"),
    ]);
    if (bRes.ok) setBalances(await bRes.json());
    if (mRes.ok) setMovements(await mRes.json());
    if (pRes.ok) {
      const p = (await pRes.json()) as Product[];
      setProducts(p);
      setForm((f) => ({
        ...f,
        productId: f.productId || p.find((x) => x.kind === "product")?.id || "",
      }));
    }
    if (wRes.ok) {
      const w = (await wRes.json()) as Warehouse[];
      setWarehouses(w);
      setForm((f) => ({
        ...f,
        warehouseId: f.warehouseId || w.find((x) => x.isDefault)?.id || w[0]?.id || "",
      }));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onAdjust(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Ajustement impossible");
      return;
    }
    setMessage("Mouvement de stock enregistré");
    setForm((f) => ({ ...f, quantity: "1", reason: "" }));
    await load();
  }

  const classified = balances
    .filter((b) => b.reorderLevel > 0)
    .map((b) => {
      const ratio = b.quantityOnHand / b.reorderLevel;
      let severity: "critical" | "warning" | "trending" | "ok" = "ok";
      if (b.quantityOnHand <= 0 || ratio <= 0.5) severity = "critical";
      else if (ratio <= 1) severity = "warning";
      else if (ratio <= 1.25) severity = "trending";
      return { ...b, severity, ratio };
    });
  const critical = classified.filter((b) => b.severity === "critical");
  const warning = classified.filter((b) => b.severity === "warning");
  const trending = classified.filter((b) => b.severity === "trending");
  const alertCount = critical.length + warning.length + trending.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Stock</h1>
        <p className="mt-2 text-sm text-sand/65">
          Soldes multi-entrepôts, mouvements simulés / réels, et alertes d’épuisement (critique ≤ 50%
          seuil, alerte ≤ seuil, tendance ≤ 125% seuil).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Lignes de solde" value={String(balances.length)} />
        <Stat label="Mouvements" value={String(movements.length)} />
        <Stat label="Critiques" value={String(critical.length)} />
        <Stat label="Alertes + tendances" value={String(warning.length + trending.length)} />
      </div>

      {alertCount > 0 && (
        <div className="space-y-2 border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-100">
            {alertCount} alerte(s) stock — réapprovisionner avant rupture
          </p>
          <div className="space-y-1">
            {[...critical, ...warning, ...trending].slice(0, 8).map((b) => (
              <p key={`${b.id}-alert`} className="text-sm text-sand/80">
                <span
                  className={
                    b.severity === "critical"
                      ? "text-rose-300"
                      : b.severity === "warning"
                        ? "text-amber-300"
                        : "text-yellow-200/90"
                  }
                >
                  {b.severity === "critical"
                    ? "CRITIQUE"
                    : b.severity === "warning"
                      ? "ALERTE"
                      : "TENDANCE"}
                </span>{" "}
                · {b.sku} · {b.warehouseName} · {b.quantityOnHand} / seuil {b.reorderLevel}
              </p>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onAdjust} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sand/80">Produit</Label>
          <select
            required
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
          >
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-sand/80">Entrepôt</Label>
          <select
            required
            value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
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
          <Label className="text-sand/80">Sens</Label>
          <select
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value as "in" | "out" | "loss" })}
            className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
          >
            <option value="in">Entrée (ajustement +)</option>
            <option value="out">Sortie (ajustement −)</option>
            <option value="loss">Perte / casse</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-sand/80">Quantité</Label>
          <Input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sand/80">Motif</Label>
          <Input
            required
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
            placeholder="Inventaire, casse, correction…"
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy} className="bg-copper text-accent-foreground">
            Enregistrer le mouvement
          </Button>
          {message && <p className="self-center text-sm text-sand/60">{message}</p>}
        </div>
      </form>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "balances" ? "default" : "outline"}
          className={tab === "balances" ? "bg-copper text-accent-foreground" : "border-white/20 bg-transparent text-sand"}
          onClick={() => setTab("balances")}
        >
          Soldes
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "movements" ? "default" : "outline"}
          className={tab === "movements" ? "bg-copper text-accent-foreground" : "border-white/20 bg-transparent text-sand"}
          onClick={() => setTab("movements")}
        >
          Mouvements
        </Button>
      </div>

      {tab === "balances" ? (
        <div className="space-y-2">
          {balances.map((b) => {
            const ratio = b.reorderLevel > 0 ? b.quantityOnHand / b.reorderLevel : 999;
            const severity =
              b.reorderLevel <= 0
                ? "ok"
                : b.quantityOnHand <= 0 || ratio <= 0.5
                  ? "critical"
                  : ratio <= 1
                    ? "warning"
                    : ratio <= 1.25
                      ? "trending"
                      : "ok";
            const border =
              severity === "critical"
                ? "border-rose-500/40 bg-rose-500/10"
                : severity === "warning"
                  ? "border-amber-500/40 bg-amber-500/10"
                  : severity === "trending"
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-white/10 bg-white/5";
            return (
              <div
                key={b.id}
                className={`flex flex-col gap-1 border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between ${border}`}
              >
                <div>
                  <p className="font-medium text-sand">
                    {b.sku} · {b.productName}
                  </p>
                  <p className="text-sand/55">
                    {b.warehouseName} · CMP {b.averageUnitCost.toFixed(2)} {b.currency}
                    {severity !== "ok"
                      ? ` · seuil ${b.reorderLevel} · ${
                          severity === "critical"
                            ? "épuisement critique"
                            : severity === "warning"
                              ? "sous seuil"
                              : "tend vers épuisement"
                        }`
                      : ""}
                  </p>
                </div>
                <p className="font-display text-lg text-white">
                  {b.quantityOnHand} {b.unitOfMeasure}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {movements.length === 0 ? (
            <p className="text-sm text-sand/55">Aucun mouvement pour l’instant — réceptionnez un BC ou faites un ajustement.</p>
          ) : (
            movements.map((m) => (
              <div key={m.id} className="border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <p className="font-medium text-sand">
                  {moveLabel[m.type] || m.type} · {m.sku} ·{" "}
                  <span className={m.quantityDelta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {m.quantityDelta >= 0 ? "+" : ""}
                    {m.quantityDelta} {m.unitOfMeasure}
                  </span>
                </p>
                <p className="text-sand/55">
                  {m.warehouseName} · {formatDate(m.createdAt)}
                  {m.referenceNumber ? ` · ${m.referenceNumber}` : ""}
                  {m.reason ? ` · ${m.reason}` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider text-sand/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
