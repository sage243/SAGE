"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DIVISIONS } from "@/lib/divisions";
import type { DivisionSlug, Offer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function InquiryForm() {
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [division, setDivision] = useState<DivisionSlug>(
    (searchParams.get("division") as DivisionSlug) || "commerce-general",
  );
  const [offerId, setOfferId] = useState(searchParams.get("offer") || "");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Offer[]) => setOffers(data))
      .catch(() => setOffers([]));
  }, []);

  const divisionOffers = useMemo(
    () => offers.filter((o) => o.division === division),
    [offers, division],
  );

  useEffect(() => {
    if (offerId && !divisionOffers.some((o) => o.id === offerId)) {
      setOfferId("");
    }
  }, [divisionOffers, offerId]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    const selectedOffer = offers.find((o) => o.id === offerId);

    const payload = {
      fullName: String(form.get("fullName") || ""),
      organization: String(form.get("organization") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      city: String(form.get("city") || ""),
      division,
      offerId: offerId || undefined,
      offerName: selectedOffer?.name,
      message: String(form.get("message") || ""),
      priority: form.get("priority") === "haute" ? "haute" : "normale",
    };

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Envoi impossible");
      }
      setStatus("success");
      e.currentTarget.reset();
      setOfferId("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-primary/20 bg-white/70 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Reçu</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-sage-deep">
          Demande enregistrée
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          L’équipe SAGE traitera votre demande dans la console ops (pipeline : nouveau → en cours
          → devis envoyé).
        </p>
        <Button className="mt-6" onClick={() => setStatus("idle")}>
          Envoyer une autre demande
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 border border-primary/10 bg-white/70 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom complet *" name="fullName" required />
        <Field label="Organisation" name="organization" />
        <Field label="Téléphone *" name="phone" required placeholder="+243 …" />
        <Field label="Email" name="email" type="email" />
        <Field label="Ville *" name="city" required defaultValue="Kinshasa" />
        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <select
            id="priority"
            name="priority"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            defaultValue="normale"
          >
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="division">Division *</Label>
          <select
            id="division"
            value={division}
            onChange={(e) => setDivision(e.target.value as DivisionSlug)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            required
          >
            {DIVISIONS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer">Offre concernée</Label>
          <select
            id="offer"
            value={offerId}
            onChange={(e) => setOfferId(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">Demande générale</option>
            {divisionOffers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Besoin / message *</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Volumes, délais, localisation, contraintes…"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">{error || "Une erreur est survenue."}</p>
      )}

      <Button type="submit" size="lg" disabled={status === "loading"}>
        {status === "loading" ? "Envoi…" : "Envoyer la demande"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </div>
  );
}
