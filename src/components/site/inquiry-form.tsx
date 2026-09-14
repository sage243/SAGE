"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DIVISIONS } from "@/lib/divisions";
import type { DivisionSlug, Offer } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const areaClass =
  "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InquiryForm() {
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Kinshasa");
  const [priority, setPriority] = useState<"normale" | "haute">("normale");
  const [message, setMessage] = useState("");
  const [division, setDivision] = useState<DivisionSlug>(
    (searchParams.get("division") as DivisionSlug) || "commerce-general",
  );
  const [offerId, setOfferId] = useState(searchParams.get("offer") || "");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Offer[]) => {
        if (!cancelled) setOffers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
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

  async function submit() {
    setStatus("loading");
    setError("");

    const selectedOffer = offers.find((o) => o.id === offerId);
    const payload = {
      fullName: fullName.trim(),
      organization: organization.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim(),
      division,
      offerId: offerId || undefined,
      offerName: selectedOffer?.name,
      message: message.trim(),
      priority,
    };

    if (!payload.fullName || !payload.phone || !payload.city || !payload.message) {
      setStatus("error");
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }

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
      setFullName("");
      setOrganization("");
      setPhone("");
      setEmail("");
      setCity("Kinshasa");
      setPriority("normale");
      setMessage("");
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
            type="button"
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
    <div className="space-y-5 border border-primary/10 bg-white/70 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet *</Label>
          <input
            id="fullName"
            className={fieldClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization">Organisation</Label>
          <input
            id="organization"
            className={fieldClass}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <input
            id="phone"
            className={fieldClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243 …"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <input
            id="city"
            className={fieldClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <select
            id="priority"
            className={fieldClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as "normale" | "haute")}
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
            className={fieldClass}
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
            className={fieldClass}
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
        <textarea
          id="message"
          className={areaClass}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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

      <Button type="button" size="lg" disabled={status === "loading"} onClick={() => void submit()}>
        {status === "loading" ? "Envoi…" : "Envoyer la demande"}
      </Button>
    </div>
  );
}
