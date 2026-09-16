"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Customer, Product, Recipe, RecipeProduction, Warehouse } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

type IngDraft = { productId: string; quantityPerOutput: string };
const emptyIng = (): IngDraft => ({ productId: "", quantityPerOutput: "0.1" });

export function RecipesManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [productions, setProductions] = useState<RecipeProduction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tab, setTab] = useState<"recettes" | "productions">("recettes");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [produceQty, setProduceQty] = useState<Record<string, string>>({});
  const [produceCustomer, setProduceCustomer] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
    description: "",
    outputProductId: "",
    warehouseId: "",
    category: "traiteur" as Recipe["category"],
    sellingPrice: "",
    ingredients: [emptyIng()] as IngDraft[],
  });

  const stockProducts = useMemo(
    () => products.filter((p) => p.kind === "product" && p.status === "active"),
    [products],
  );
  const outputProducts = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products],
  );

  async function load() {
    const [r, p, pr, w, c] = await Promise.all([
      fetch("/api/recipes"),
      fetch("/api/recipes?view=productions"),
      fetch("/api/products-master"),
      fetch("/api/warehouses"),
      fetch("/api/customers"),
    ]);
    if (r.ok) setRecipes(await r.json());
    if (p.ok) setProductions(await p.json());
    if (pr.ok) {
      const list = (await pr.json()) as Product[];
      setProducts(list);
      setForm((f) => ({
        ...f,
        outputProductId:
          f.outputProductId || list.find((x) => x.sku === "RST-TRT-MIDI")?.id || list[0]?.id || "",
      }));
    }
    if (w.ok) {
      const list = (await w.json()) as Warehouse[];
      setWarehouses(list);
      setForm((f) => ({
        ...f,
        warehouseId: f.warehouseId || list.find((x) => x.isDefault)?.id || list[0]?.id || "",
      }));
    }
    if (c.ok) setCustomers(await c.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: form.id || undefined,
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        outputProductId: form.outputProductId,
        warehouseId: form.warehouseId,
        category: form.category,
        sellingPrice: Number(form.sellingPrice || 0),
        ingredients: form.ingredients
          .filter((i) => i.productId && Number(i.quantityPerOutput) > 0)
          .map((i) => ({
            productId: i.productId,
            quantityPerOutput: Number(i.quantityPerOutput),
          })),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Enregistrement impossible");
      return;
    }
    setForm({
      id: "",
      code: "",
      name: "",
      description: "",
      outputProductId: form.outputProductId,
      warehouseId: form.warehouseId,
      category: "traiteur",
      sellingPrice: "",
      ingredients: [emptyIng()],
    });
    setMessage("Recette enregistrée");
    await load();
  }

  async function onProduce(recipe: Recipe) {
    setBusy(true);
    setMessage("");
    const qty = Number(produceQty[recipe.id] || "1");
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "produce",
        recipeId: recipe.id,
        quantity: qty,
        mode: "service",
        customerId: produceCustomer[recipe.id] || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || "Production impossible");
      return;
    }
    const data = await res.json();
    setMessage(
      `${data.number} · ${data.quantity}× ${recipe.name} · coût ${data.totalCost.toFixed(2)} ${data.currency} · marge ${data.marginPct.toFixed(1)}%`,
    );
    setTab("productions");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Recettes</h1>
        <p className="mt-2 text-sm text-sand/65">
          Phase 6 — restauration & boissons : nomenclature (BOM) → consommation stock à chaque
          service / préparation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          type="button"
          className={tab === "recettes" ? "bg-copper text-accent-foreground" : "border-white/20 bg-transparent text-sand"}
          variant={tab === "recettes" ? "default" : "outline"}
          onClick={() => setTab("recettes")}
        >
          Recettes
        </Button>
        <Button
          size="sm"
          type="button"
          className={tab === "productions" ? "bg-copper text-accent-foreground" : "border-white/20 bg-transparent text-sand"}
          variant={tab === "productions" ? "default" : "outline"}
          onClick={() => setTab("productions")}
        >
          Productions / services
        </Button>
      </div>

      {message && <p className="text-sm text-sand/70">{message}</p>}

      {tab === "recettes" && (
        <div className="space-y-6">
          <form onSubmit={onSave} className="space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required />
              <Field label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <div className="space-y-2">
                <Label className="text-sand/80">Sortie (plat / service)</Label>
                <select
                  required
                  value={form.outputProductId}
                  onChange={(e) => {
                    const p = outputProducts.find((x) => x.id === e.target.value);
                    setForm({
                      ...form,
                      outputProductId: e.target.value,
                      sellingPrice: p ? String(p.sellingPrice) : form.sellingPrice,
                    });
                  }}
                  className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
                >
                  {outputProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sand/80">Entrepôt de consommation</Label>
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
                <Label className="text-sand/80">Catégorie</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Recipe["category"] })}
                  className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
                >
                  <option value="plat">Plat</option>
                  <option value="boisson">Boisson</option>
                  <option value="traiteur">Traiteur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <Field
                label="Prix de vente / unité"
                value={form.sellingPrice}
                onChange={(v) => setForm({ ...form, sellingPrice: v })}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-sand/80">Ingrédients (par unité de sortie)</p>
              {form.ingredients.map((ing, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-2">
                  <select
                    required
                    value={ing.productId}
                    onChange={(e) => {
                      const next = [...form.ingredients];
                      next[idx] = { ...next[idx], productId: e.target.value };
                      setForm({ ...form, ingredients: next });
                    }}
                    className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand"
                  >
                    <option value="">Ingrédient stock…</option>
                    {stockProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} · {p.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    required
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={ing.quantityPerOutput}
                    onChange={(e) => {
                      const next = [...form.ingredients];
                      next[idx] = { ...next[idx], quantityPerOutput: e.target.value };
                      setForm({ ...form, ingredients: next });
                    }}
                    className="border-white/15 bg-[#0b2a18] text-sand"
                    placeholder="Qté / sortie"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-transparent text-sand"
                onClick={() => setForm({ ...form, ingredients: [...form.ingredients, emptyIng()] })}
              >
                Ajouter un ingrédient
              </Button>
            </div>

            <Button type="submit" disabled={busy} className="bg-copper text-accent-foreground">
              {form.id ? "Mettre à jour" : "Créer la recette"}
            </Button>
          </form>

          <div className="space-y-3">
            {recipes.map((r) => {
              const margin =
                r.sellingPrice > 0
                  ? ((r.sellingPrice - r.theoreticalCost) / r.sellingPrice) * 100
                  : 0;
              return (
                <div key={r.id} className="border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {r.code} · {r.name}
                      </p>
                      <p className="text-sm text-sand/60">
                        Sortie {r.outputSku} · {r.warehouseName} · coût théorique{" "}
                        {r.theoreticalCost.toFixed(2)} {r.currency} · vente {r.sellingPrice.toFixed(2)} ·
                        marge {margin.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <select
                        value={produceCustomer[r.id] || ""}
                        onChange={(e) => setProduceCustomer({ ...produceCustomer, [r.id]: e.target.value })}
                        className="h-8 rounded-md border border-white/15 bg-[#0b2a18] px-2 text-xs text-sand"
                      >
                        <option value="">Client (optionnel)</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.legalName}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={produceQty[r.id] ?? ""}
                        onChange={(e) => setProduceQty({ ...produceQty, [r.id]: e.target.value })}
                        className="h-8 w-20 border-white/15 bg-[#0b2a18] text-sand"
                      />
                      <Button
                        size="sm"
                        disabled={busy}
                        className="bg-copper text-accent-foreground"
                        onClick={() => void onProduce(r)}
                      >
                        Servir / produire
                      </Button>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-sand/65">
                    {r.ingredients.map((i) => (
                      <li key={i.id}>
                        {i.sku} · {i.quantityPerOutput} {i.unitOfMeasure} / unité
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "productions" && (
        <div className="space-y-2">
          {productions.length === 0 ? (
            <p className="text-sm text-sand/55">Aucune production — servez une recette pour consommer le stock.</p>
          ) : (
            productions.map((p) => (
              <div key={p.id} className="border border-white/10 bg-white/5 px-3 py-3 text-sm">
                <p className="font-medium text-sand">
                  {p.number} · {p.recipeCode} · {p.quantity}× {p.outputName}
                </p>
                <p className="text-sand/55">
                  {formatDate(p.producedAt)} · coût {p.totalCost.toFixed(2)} {p.currency} · CA{" "}
                  {p.revenue.toFixed(2)} · marge {p.marginPct.toFixed(1)}%
                  {p.customerName ? ` · ${p.customerName}` : ""}
                </p>
                <ul className="mt-2 space-y-0.5 text-sand/45">
                  {p.ingredientLines.map((l, i) => (
                    <li key={i}>
                      −{l.quantity} {l.unitOfMeasure} {l.sku} (coût {l.lineCost.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
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
