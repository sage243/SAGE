"use client";

import { FormEvent, useEffect, useState } from "react";
import { DIVISIONS } from "@/lib/divisions";
import type { Product } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty = {
  id: "",
  sku: "",
  name: "",
  description: "",
  kind: "product",
  activity: "restauration-vivres",
  category: "Vivres",
  unitOfMeasure: "unité",
  purchasePrice: "0",
  transportCost: "0",
  handlingCost: "0",
  storageCost: "0",
  otherDirectCosts: "0",
  sellingPrice: "0",
  wholesalePrice: "0",
  retailPrice: "0",
  priceLabel: "",
  minStock: "0",
  maxStock: "0",
  reorderLevel: "0",
  quantityOnHand: "0",
  status: "active",
  featured: false,
  publicVisible: true,
  tags: "",
};

export function ProductsMasterManager() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/products-master?admin=1");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  const landed =
    Number(form.purchasePrice || 0) +
    Number(form.transportCost || 0) +
    Number(form.handlingCost || 0) +
    Number(form.storageCost || 0) +
    Number(form.otherDirectCosts || 0);
  const margin =
    Number(form.sellingPrice || 0) > 0
      ? ((Number(form.sellingPrice) - landed) / Number(form.sellingPrice)) * 100
      : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/products-master", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id: form.id || undefined,
        purchasePrice: Number(form.purchasePrice || 0),
        transportCost: Number(form.transportCost || 0),
        handlingCost: Number(form.handlingCost || 0),
        storageCost: Number(form.storageCost || 0),
        otherDirectCosts: Number(form.otherDirectCosts || 0),
        sellingPrice: Number(form.sellingPrice || 0),
        wholesalePrice: Number(form.wholesalePrice || 0),
        retailPrice: Number(form.retailPrice || 0),
        minStock: Number(form.minStock || 0),
        maxStock: Number(form.maxStock || 0),
        reorderLevel: Number(form.reorderLevel || 0),
        quantityOnHand: Number(form.quantityOnHand || 0),
        priceLabel: form.priceLabel || `${form.sellingPrice} USD`,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Erreur");
      return;
    }
    setMessage(form.id ? "Produit mis à jour" : "Produit créé");
    setForm(empty);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Produits</h1>
        <p className="mt-2 text-sm text-sand/65">
          Product Master avec coût réel (landed cost) = achat + transport + manutention + stockage + autres.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
        <Field label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Catégorie" value={form.category} onChange={(v) => setForm({ ...form, category: v })} required />
        <div className="space-y-2">
          <Label className="text-sand/80">Activité</Label>
          <select
            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b2a18] px-2 text-sm text-sand"
            value={form.activity}
            onChange={(e) => setForm({ ...form, activity: e.target.value })}
          >
            {DIVISIONS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.shortName}
              </option>
            ))}
          </select>
        </div>
        <Field label="Unité" value={form.unitOfMeasure} onChange={(v) => setForm({ ...form, unitOfMeasure: v })} required />
        <Field label="Prix achat" value={form.purchasePrice} onChange={(v) => setForm({ ...form, purchasePrice: v })} />
        <Field label="Transport" value={form.transportCost} onChange={(v) => setForm({ ...form, transportCost: v })} />
        <Field label="Manutention" value={form.handlingCost} onChange={(v) => setForm({ ...form, handlingCost: v })} />
        <Field label="Stockage" value={form.storageCost} onChange={(v) => setForm({ ...form, storageCost: v })} />
        <Field label="Autres coûts" value={form.otherDirectCosts} onChange={(v) => setForm({ ...form, otherDirectCosts: v })} />
        <Field label="Prix vente" value={form.sellingPrice} onChange={(v) => setForm({ ...form, sellingPrice: v })} />
        <Field label="Prix gros" value={form.wholesalePrice} onChange={(v) => setForm({ ...form, wholesalePrice: v })} />
        <Field label="Prix détail" value={form.retailPrice} onChange={(v) => setForm({ ...form, retailPrice: v })} />
        <Field label="Stock actuel" value={form.quantityOnHand} onChange={(v) => setForm({ ...form, quantityOnHand: v })} />
        <Field label="Seuil réappro" value={form.reorderLevel} onChange={(v) => setForm({ ...form, reorderLevel: v })} />
        <Field label="Libellé public" value={form.priceLabel} onChange={(v) => setForm({ ...form, priceLabel: v })} />
        <div className="sm:col-span-3 rounded-md border border-copper/40 bg-copper/10 px-3 py-2 text-sm text-sand">
          Coût réel calculé : <strong>{landed.toFixed(2)} USD</strong> · Marge indicative :{" "}
          <strong>{margin.toFixed(1)}%</strong>
        </div>
        <div className="space-y-2 sm:col-span-3">
          <Label className="text-sand/80">Description</Label>
          <textarea
            className="min-h-20 w-full rounded-lg border border-white/15 bg-[#0b2a18] px-3 py-2 text-sm text-sand"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-3">
          <Button type="submit" className="bg-copper text-accent-foreground">
            {form.id ? "Mettre à jour" : "Créer"}
          </Button>
          {message && <p className="self-center text-sm text-sand/60">{message}</p>}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-white">
                  {p.sku} · {p.name}
                </p>
                <p className="text-sm text-sand/60">
                  Coût réel {p.landedCost.toFixed(2)} · vente {p.sellingPrice.toFixed(2)} · stock {p.quantityOnHand}{" "}
                  {p.unitOfMeasure}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-transparent text-sand"
                onClick={() =>
                  setForm({
                    id: p.id,
                    sku: p.sku,
                    name: p.name,
                    description: p.description,
                    kind: p.kind,
                    activity: p.activity,
                    category: p.category,
                    unitOfMeasure: p.unitOfMeasure,
                    purchasePrice: String(p.purchasePrice),
                    transportCost: String(p.transportCost),
                    handlingCost: String(p.handlingCost),
                    storageCost: String(p.storageCost),
                    otherDirectCosts: String(p.otherDirectCosts),
                    sellingPrice: String(p.sellingPrice),
                    wholesalePrice: String(p.wholesalePrice),
                    retailPrice: String(p.retailPrice),
                    priceLabel: p.priceLabel,
                    minStock: String(p.minStock),
                    maxStock: String(p.maxStock),
                    reorderLevel: String(p.reorderLevel),
                    quantityOnHand: String(p.quantityOnHand),
                    status: p.status,
                    featured: p.featured,
                    publicVisible: p.publicVisible,
                    tags: p.tags.join(", "),
                  })
                }
              >
                Éditer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sand/80">{label}</Label>
      <Input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-white/15 bg-[#0b2a18] text-sand"
      />
    </div>
  );
}
