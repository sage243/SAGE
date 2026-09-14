"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DIVISIONS } from "@/lib/divisions";
import type { DivisionSlug, Offer } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function InquiryForm() {
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [division, setDivision] = useState<DivisionSlug>(
    (searchParams.get("division") as DivisionSlug) || "commerce-general",
  );
  const [offerId, setOfferId] = useState(searchParams.get("offer") || "");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Offer[]) => setOffers(Array.isArray(data) ? data : []))
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
    const formEl = e.currentTarget;
    setStatus("loading");
    setError("");
    const form = new FormData(formEl);
    const selectedOffer = offers.find((o) => o.id === offerId);

    const payload = {
      fullName: String(form.get("fullName") || "").trim(),
      organization: String(form.get("organization") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      email: String(form.get("email") || "").trim(),
      city: String(form.get("city") || "").trim(),
      division,
      offerId: offerId || undefined,
      offerName: selectedOffer?.name,
      message: String(form.get("message") || "").trim(),
      priority: form.get("priority") === "haute" ? "haute" : "normale",
    };

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Envoi impossible");
      }
      setCreatedId(data.id || "");
      setOfferId("");
      formEl.reset();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-primary/20 bg-white/70 p-8" role="status">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Reçu</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-sage-deep">
          Demande enregistrée
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Votre demande a bien été créée
          {createdId ? (
            <>
              {" "}
              sous la référence <strong className="text-foreground">{createdId}</strong>
            </>
          ) : null}
          . Elle apparaît dans la console ops (pipeline : nouveau → en cours → devis envoyé).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setCreatedId("");
              setStatus("idle");
            }}
          >
            Envoyer une autre demande
          </Button>
          <Link
            href="/admin/demandes"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Voir dans la console
          </Link>
        </div>
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
        <p className="text-sm text-destructive" role="alert">
          {error || "Une erreur est survenue."}
        </p>
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
