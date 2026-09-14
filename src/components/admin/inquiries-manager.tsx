"use client";

import { useCallback, useEffect, useState } from "react";
import { DIVISIONS } from "@/lib/divisions";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const STATUSES: InquiryStatus[] = [
  "nouveau",
  "en_cours",
  "devis_envoye",
  "gagne",
  "perdu",
];

const STATUS_LABEL: Record<InquiryStatus, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  devis_envoye: "Devis envoyé",
  gagne: "Gagné",
  perdu: "Perdu",
};

export function InquiriesManager({ initialItems = [] }: { initialItems?: Inquiry[] }) {
  const [items, setItems] = useState<Inquiry[]>(initialItems);
  const [filter, setFilter] = useState<InquiryStatus | "all">("all");
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialItems.map((i) => [i.id, i.internalNote || ""])),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inquiries", { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger les demandes");
      const data: Inquiry[] = await res.json();
      if (!Array.isArray(data)) throw new Error("Réponse API invalide");
      setItems(data);
      setNotes(Object.fromEntries(data.map((i) => [i.id, i.internalNote || ""])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Partial<Inquiry>) {
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      if (!res.ok) throw new Error("Mise à jour impossible");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  const visible = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Demandes</h1>
          <p className="mt-2 text-sm text-sand/65">
            Pipeline commercial : nouveau → en cours → devis envoyé → gagné / perdu.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 bg-transparent text-sand hover:bg-white/10"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Actualisation…" : "Actualiser"}
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Toutes ({items.length})
        </FilterChip>
        {STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={filter === status}
            onClick={() => setFilter(status)}
          >
            {STATUS_LABEL[status]} ({items.filter((i) => i.status === status).length})
          </FilterChip>
        ))}
      </div>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <p className="text-sm text-sand/60">
            {loading ? "Chargement des demandes…" : "Aucune demande dans ce filtre."}
          </p>
        ) : (
          visible.map((item) => {
            const division = DIVISIONS.find((d) => d.slug === item.division);
            return (
              <article
                key={item.id}
                className="space-y-4 border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-copper text-accent-foreground">
                        {STATUS_LABEL[item.status]}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-sand">
                        {division?.shortName}
                      </Badge>
                      {item.priority === "haute" && (
                        <Badge variant="destructive">Priorité haute</Badge>
                      )}
                    </div>
                    <h3 className="mt-3 font-display text-xl text-white">{item.fullName}</h3>
                    <p className="text-sm text-sand/60">
                      {item.organization ? `${item.organization} · ` : ""}
                      {item.city} · {item.phone}
                      {item.email ? ` · ${item.email}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-sand/40">
                      {formatDate(item.createdAt)} · {item.id}
                    </p>
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) =>
                      void patch(item.id, { status: e.target.value as InquiryStatus })
                    }
                    className="h-8 rounded-lg border border-white/15 bg-[#0b2a18] px-2.5 text-sm text-sand"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {item.offerName && (
                  <p className="text-sm text-sand/75">
                    Offre : <span className="text-sand">{item.offerName}</span>
                  </p>
                )}
                <p className="text-sm leading-relaxed text-sand/85">{item.message}</p>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-sand/45">Note interne</p>
                  <Textarea
                    rows={2}
                    value={notes[item.id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="border-white/15 bg-[#0b2a18] text-sand"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-copper text-accent-foreground"
                      onClick={() =>
                        void patch(item.id, { internalNote: notes[item.id] || "" })
                      }
                    >
                      Enregistrer la note
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 bg-transparent text-sand hover:bg-white/10"
                      onClick={() =>
                        void patch(item.id, {
                          priority: item.priority === "haute" ? "normale" : "haute",
                        })
                      }
                    >
                      {item.priority === "haute" ? "Retirer priorité" : "Priorité haute"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-white/15 px-3 py-1.5 text-sm text-white"
          : "rounded-md border border-white/10 px-3 py-1.5 text-sm text-sand/65 hover:bg-white/5"
      }
    >
      {children}
    </button>
  );
}
