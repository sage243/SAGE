"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Supplier } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty = {
  id: "",
  code: "",
  legalName: "",
  contactPerson: "",
  phone: "",
  email: "",
  city: "Kinshasa",
  paymentTermsDays: "7",
  productCategories: "",
  outstandingBalance: "0",
  status: "actif",
};

export function SuppliersManager() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/suppliers");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id: form.id || undefined,
        paymentTermsDays: Number(form.paymentTermsDays || 0),
        outstandingBalance: Number(form.outstandingBalance || 0),
        productCategories: form.productCategories,
      }),
    });
    if (!res.ok) {
      setMessage("Enregistrement impossible");
      return;
    }
    setForm(empty);
    setMessage(form.id ? "Fournisseur mis à jour" : "Fournisseur créé");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Fournisseurs</h1>
        <p className="mt-2 text-sm text-sand/65">Master fournisseurs pour les achats et le calcul du coût réel.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
        <Field label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required />
        <Field label="Raison sociale" value={form.legalName} onChange={(v) => setForm({ ...form, legalName: v })} required />
        <Field label="Contact" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
        <Field label="Délai paiement (jours)" value={form.paymentTermsDays} onChange={(v) => setForm({ ...form, paymentTermsDays: v })} />
        <Field label="Solde dû" value={form.outstandingBalance} onChange={(v) => setForm({ ...form, outstandingBalance: v })} />
        <Field label="Catégories (virgules)" value={form.productCategories} onChange={(v) => setForm({ ...form, productCategories: v })} />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" className="bg-copper text-accent-foreground">
            {form.id ? "Mettre à jour" : "Créer"}
          </Button>
          {message && <p className="self-center text-sm text-sand/60">{message}</p>}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">
                {s.code} · {s.legalName}
              </p>
              <p className="text-sm text-sand/60">
                {s.city} · {s.phone} · {s.email || "—"} · solde {s.outstandingBalance} {s.outstandingCurrency}
              </p>
              {s.address && <p className="mt-1 text-xs text-sand/45">{s.address}</p>}
              {s.notes && <p className="mt-2 max-w-2xl text-xs leading-relaxed text-sand/50">{s.notes}</p>}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-sand"
              onClick={() =>
                setForm({
                  id: s.id,
                  code: s.code,
                  legalName: s.legalName,
                  contactPerson: s.contactPerson || "",
                  phone: s.phone,
                  email: s.email || "",
                  city: s.city,
                  paymentTermsDays: String(s.paymentTermsDays),
                  productCategories: s.productCategories.join(", "),
                  outstandingBalance: String(s.outstandingBalance),
                  status: s.status,
                })
              }
            >
              Éditer
            </Button>
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
