"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DIVISIONS } from "@/lib/divisions";
import type { DivisionSlug, Offer, OfferKind, OfferStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const emptyForm = {
  id: "",
  division: "commerce-general" as DivisionSlug,
  kind: "product" as OfferKind,
  name: "",
  description: "",
  priceLabel: "",
  unit: "",
  tags: "",
  status: "active" as OfferStatus,
  featured: false,
  stockNote: "",
};

export function ProductsManager({ initialOffers = [] }: { initialOffers?: Offer[] }) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/products?admin=1", { cache: "no-store" });
    if (!res.ok) throw new Error("Chargement catalogue impossible");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Réponse API invalide");
    setOffers(data);
  }, []);

  useEffect(() => {
    void load().catch((err) =>
      setMessage(err instanceof Error ? err.message : "Erreur de chargement"),
    );
  }, [load]);

  function edit(offer: Offer) {
    setForm({
      id: offer.id,
      division: offer.division,
      kind: offer.kind,
      name: offer.name,
      description: offer.description,
      priceLabel: offer.priceLabel,
      unit: offer.unit || "",
      tags: offer.tags.join(", "),
      status: offer.status,
      featured: offer.featured,
      stockNote: offer.stockNote || "",
    });
    setMessage("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: form.id || undefined,
          tags: form.tags,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec");
      }
      setForm(emptyForm);
      setMessage(form.id ? "Offre mise à jour." : "Offre créée.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette offre ?")) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    if (form.id === id) setForm(emptyForm);
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Produits & services</h1>
        <p className="mt-2 text-sm text-sand/65">
          Publiez, mettez en brouillon ou archivez les offres par division Article 2.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-md border border-white/10 bg-white/5 p-5 sm:grid-cols-2"
      >
        <h2 className="font-display text-xl text-white sm:col-span-2">
          {form.id ? "Modifier l’offre" : "Nouvelle offre"}
        </h2>

        <Field label="Nom">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </Field>
        <Field label="Prix affiché">
          <Input
            required
            value={form.priceLabel}
            onChange={(e) => setForm({ ...form, priceLabel: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </Field>

        <Field label="Division">
          <select
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value as DivisionSlug })}
            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b2a18] px-2.5 text-sm text-sand"
          >
            {DIVISIONS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as OfferKind })}
            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b2a18] px-2.5 text-sm text-sand"
          >
            <option value="product">Produit</option>
            <option value="service">Service</option>
          </select>
        </Field>

        <Field label="Statut">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as OfferStatus })}
            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b2a18] px-2.5 text-sm text-sand"
          >
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
            <option value="archived">Archivé</option>
          </select>
        </Field>
        <Field label="Unité (optionnel)">
          <Input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </Field>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sand/80">Description</Label>
          <Textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </div>

        <Field label="Tags (séparés par des virgules)">
          <Input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </Field>
        <Field label="Note stock">
          <Input
            value={form.stockNote}
            onChange={(e) => setForm({ ...form, stockNote: e.target.value })}
            className="border-white/15 bg-[#0b2a18] text-sand"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-sand/80 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Mettre en avant (prioritaire)
        </label>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving} className="bg-copper text-accent-foreground">
            {saving ? "Enregistrement…" : form.id ? "Mettre à jour" : "Créer"}
          </Button>
          {form.id && (
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-sand hover:bg-white/10"
              onClick={() => setForm(emptyForm)}
            >
              Annuler
            </Button>
          )}
          {message && <p className="self-center text-sm text-sand/70">{message}</p>}
        </div>
      </form>

      <div className="space-y-3">
        {offers.map((offer) => {
          const division = DIVISIONS.find((d) => d.slug === offer.division);
          return (
            <div
              key={offer.id}
              className="flex flex-col gap-3 border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{division?.shortName}</Badge>
                  <Badge variant="outline" className="border-white/20 text-sand">
                    {offer.status}
                  </Badge>
                  {offer.featured && <Badge className="bg-copper text-accent-foreground">Prioritaire</Badge>}
                </div>
                <h3 className="mt-2 font-display text-lg text-white">{offer.name}</h3>
                <p className="mt-1 text-sm text-sand/60">{offer.priceLabel}</p>
                <p className="mt-1 text-xs text-sand/40">MAJ {formatDate(offer.updatedAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-transparent text-sand hover:bg-white/10"
                  onClick={() => edit(offer)}
                >
                  Éditer
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(offer.id)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sand/80">{label}</Label>
      {children}
    </div>
  );
}
