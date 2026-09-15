"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProfitRow } from "@/lib/reports";

type Report = Awaited<ReturnType<typeof import("@/lib/reports").getProfitabilityReport>>;

type Tab = "produits" | "clients" | "activites" | "catalogue";

export function ProfitabilityManager() {
  const [report, setReport] = useState<Report | null>(null);
  const [tab, setTab] = useState<Tab>("produits");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/reports?view=profitability");
      if (!res.ok) {
        setError("Impossible de charger les rapports");
        return;
      }
      setReport(await res.json());
    })();
  }, []);

  if (error) return <p className="text-sm text-rose-300">{error}</p>;
  if (!report) return <p className="text-sm text-sand/55">Chargement des marges…</p>;

  const rows: ProfitRow[] =
    tab === "produits"
      ? report.byProduct
      : tab === "clients"
        ? report.byCustomer
        : tab === "activites"
          ? report.byActivity
          : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Rentabilité</h1>
        <p className="mt-2 text-sm text-sand/65">
          Marges calculées sur coût figé des factures (jamais recalculé depuis le prix d’achat live).
          Devise de base : {report.baseCurrency} · FX 1 USD = {report.fxUsdToCdf.toLocaleString("fr-CD")}{" "}
          CDF.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="CA facturé" value={`${report.totals.revenue.toFixed(2)} USD`} />
        <Stat label="Coût réel vendu" value={`${report.totals.cost.toFixed(2)} USD`} />
        <Stat label="Marge brute" value={`${report.totals.grossProfit.toFixed(2)} USD`} />
        <Stat label="Taux de marge" value={`${report.totals.marginPct.toFixed(1)}%`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["produits", "Par produit"],
            ["clients", "Par client"],
            ["activites", "Par activité"],
            ["catalogue", "Catalogue (théorique)"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            type="button"
            variant={tab === id ? "default" : "outline"}
            className={
              tab === id ? "bg-copper text-accent-foreground" : "border-white/20 bg-transparent text-sand"
            }
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab !== "catalogue" ? (
        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-sand/55">
              Aucune vente facturée encore — les marges réalisées apparaîtront après facturation.
            </p>
          ) : (
            rows.map((r) => (
              <div
                key={r.key}
                className="flex flex-col gap-1 border border-white/10 bg-white/5 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-sand">
                    {r.secondary ? `${r.secondary} · ` : ""}
                    {r.label}
                  </p>
                  <p className="text-sand/50">
                    Qté {r.quantity} · CA {r.revenue.toFixed(2)} · coût {r.cost.toFixed(2)}
                    {r.invoiceCount ? ` · ${r.invoiceCount} ligne(s)/facture(s)` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-white">{r.grossProfit.toFixed(2)} USD</p>
                  <p className={r.marginPct < 8 ? "text-amber-300" : "text-emerald-300"}>
                    {r.marginPct.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-sand/60">
            Marge théorique catalogue (prix de vente − coût réel actuel). Utile pour le pilotage
            d’assortiment — distinct de la marge réalisée sur factures.
          </p>
          {report.lowMarginCatalog.length > 0 && (
            <div className="border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {report.lowMarginCatalog.length} article(s) sous 8% de marge théorique — à revoir (prix
              ou coût).
            </div>
          )}
          <div className="space-y-2">
            {report.catalogMargins.map((c) => (
              <div
                key={c.key}
                className="flex flex-col gap-1 border border-white/10 bg-white/5 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-sand">
                    {c.sku} · {c.label}
                  </p>
                  <p className="text-sand/50">
                    Coût réel {c.landedCost.toFixed(2)} · vente {c.sellingPrice.toFixed(2)} · gros{" "}
                    {c.wholesalePrice.toFixed(2)} · stock {c.quantityOnHand}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white">{c.grossProfit.toFixed(2)} USD/u</p>
                  <p className={c.marginPct < 8 ? "text-amber-300" : "text-emerald-300"}>
                    {c.marginPct.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider text-sand/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
