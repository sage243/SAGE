"use client";

import { useEffect, useState } from "react";
import type { Correspondence } from "@/lib/correspondence-types";
import { Button } from "@/components/ui/button";

const statusLabel: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accuse_reception: "Accusé de réception",
  en_attente_reponse: "En attente de réponse",
  clos: "Clos",
};

const directionLabel: Record<string, string> = {
  outbound: "Sortante",
  inbound: "Entrante",
};

export function CorrespondencesManager() {
  const [items, setItems] = useState<Correspondence[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/correspondences");
    if (res.ok) {
      const data = (await res.json()) as Correspondence[];
      setItems(data);
      if (!selected && data[0]) setSelected(data[0].id);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: Correspondence["status"]) {
    const item = items.find((c) => c.id === id);
    if (!item) return;
    const res = await fetch("/api/correspondences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status }),
    });
    if (!res.ok) {
      setMessage("Mise à jour impossible");
      return;
    }
    setMessage(`Statut → ${statusLabel[status]}`);
    await load();
  }

  const active = items.find((c) => c.id === selected) || items[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Correspondances</h1>
        <p className="mt-2 text-sm text-sand/65">
          Courriers commerciaux fournisseurs / partenaires — suivi d’ouverture de compte et grilles
          tarifaires.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {items.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`w-full border px-3 py-3 text-left text-sm ${
                active?.id === c.id
                  ? "border-copper/50 bg-copper/15 text-white"
                  : "border-white/10 bg-white/5 text-sand/80 hover:bg-white/10"
              }`}
            >
              <p className="font-medium">{c.reference}</p>
              <p className="mt-1 text-xs opacity-70">
                {c.counterpartyName} · {directionLabel[c.direction]}
              </p>
              <p className="mt-1 text-xs text-copper">{statusLabel[c.status]}</p>
            </button>
          ))}
        </div>

        {active ? (
          <article className="space-y-4 border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-copper">{active.reference}</p>
                <h2 className="mt-2 font-display text-2xl text-white">{active.subject}</h2>
                <p className="mt-2 text-sm text-sand/60">
                  Kinshasa, le {new Date(active.date + "T12:00:00").toLocaleDateString("fr-CD", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  · {directionLabel[active.direction]} · {statusLabel[active.status]}
                </p>
              </div>
              {active.attachmentPath && (
                <a
                  href={active.attachmentPath}
                  download
                  className="rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-sand hover:bg-white/10"
                >
                  Télécharger DOCX
                </a>
              )}
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Destinataire" value={`${active.toAttention || ""}\n${active.counterpartyName}\n${active.counterpartyAddress || ""}`} />
              <Info label="Émetteur" value={`${active.fromName}\n${active.fromTitle}`} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-sand/45">Résumé</p>
              <p className="mt-2 text-sm leading-relaxed text-sand/85">{active.bodySummary}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-sand/45">Éléments sollicités</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sand/80">
                {active.requestedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {active.cc && active.cc.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-sand/45">Copies</p>
                <p className="mt-2 text-sm text-sand/70">{active.cc.join(" · ")}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <Button
                size="sm"
                className="bg-copper text-accent-foreground"
                onClick={() => void setStatus(active.id, "envoye")}
              >
                Marquer envoyé
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-transparent text-sand"
                onClick={() => void setStatus(active.id, "en_attente_reponse")}
              >
                En attente réponse
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-transparent text-sand"
                onClick={() => void setStatus(active.id, "clos")}
              >
                Clôturer
              </Button>
              {message && <p className="self-center text-sm text-sand/60">{message}</p>}
            </div>
          </article>
        ) : (
          <p className="text-sm text-sand/55">Aucune correspondance.</p>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-wider text-sand/45">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sand/85">{value}</p>
    </div>
  );
}
