"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Customer } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty = {
  id: "",
  code: "",
  type: "entreprise",
  legalName: "",
  contactPerson: "",
  phone: "",
  whatsapp: "",
  email: "",
  city: "Kinshasa",
  creditLimit: "0",
  paymentTermsDays: "0",
  status: "actif",
  notes: "",
};

export function CustomersManager() {
  const [items, setItems] = useState<Customer[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/customers");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id: form.id || undefined,
        creditLimit: Number(form.creditLimit || 0),
        paymentTermsDays: Number(form.paymentTermsDays || 0),
      }),
    });
    if (!res.ok) {
      setMessage("Enregistrement impossible");
      return;
    }
    setForm(empty);
    setMessage(form.id ? "Client mis à jour" : "Client créé");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Clients</h1>
        <p className="mt-2 text-sm text-sand/65">Master clients — base du workflow devis → commande → facture.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
        <Field label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required />
        <Field label="Raison sociale / Nom" value={form.legalName} onChange={(v) => setForm({ ...form, legalName: v })} required />
        <div className="space-y-2">
          <Label className="text-sand/80">Type</Label>
          <select
            className="h-8 w-full rounded-lg border border-white/15 bg-[#0b2a18] px-2 text-sm text-sand"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="particulier">Particulier</option>
            <option value="entreprise">Entreprise</option>
            <option value="institution">Institution</option>
          </select>
        </div>
        <Field label="Contact" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
        <Field label="Plafond crédit" value={form.creditLimit} onChange={(v) => setForm({ ...form, creditLimit: v })} />
        <Field label="Délai paiement (jours)" value={form.paymentTermsDays} onChange={(v) => setForm({ ...form, paymentTermsDays: v })} />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" className="bg-copper text-accent-foreground">
            {form.id ? "Mettre à jour" : "Créer"}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" className="border-white/20 bg-transparent text-sand" onClick={() => setForm(empty)}>
              Annuler
            </Button>
          )}
          {message && <p className="self-center text-sm text-sand/60">{message}</p>}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex flex-col gap-2 border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">
                {c.code} · {c.legalName}
              </p>
              <p className="text-sm text-sand/60">
                {c.type} · {c.city} · {c.phone} · crédit {c.creditLimit} {c.creditLimitCurrency}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-sand"
              onClick={() =>
                setForm({
                  id: c.id,
                  code: c.code,
                  type: c.type,
                  legalName: c.legalName,
                  contactPerson: c.contactPerson || "",
                  phone: c.phone,
                  whatsapp: c.whatsapp || "",
                  email: c.email || "",
                  city: c.city,
                  creditLimit: String(c.creditLimit),
                  paymentTermsDays: String(c.paymentTermsDays),
                  status: c.status,
                  notes: c.notes || "",
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
