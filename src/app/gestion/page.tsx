import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { getManagementDashboard } from "@/lib/reports";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestion SAGE",
};

export default async function GestionDashboardPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");

  const dash = await getManagementDashboard();
  const k = dash.kpis;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Tableau de bord</h1>
        <p className="mt-2 text-sm text-sand/65">
          Phase 6 — recettes restauration (conso. stock) + rentabilité et KPIs USD/CDF.
        </p>
        <p className="mt-1 text-xs text-sand/45">
          FX : 1 USD = {dash.fxUsdToCdf.toLocaleString("fr-CD")} CDF
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="CA facturé"
          value={`${k.salesInvoicedUsd.toFixed(0)} USD`}
          hint={`${k.salesInvoicedCdf.toLocaleString("fr-CD")} CDF`}
        />
        <Stat
          label="Marge brute"
          value={`${k.grossProfitUsd.toFixed(0)} USD`}
          hint={`${k.marginPct.toFixed(1)}% · ${k.grossProfitCdf.toLocaleString("fr-CD")} CDF`}
        />
        <Stat
          label="Stock (coût réel)"
          value={`${k.inventoryUsd.toFixed(0)} USD`}
          hint={`Réservé ${k.reservedInventoryUsd.toFixed(0)} USD`}
        />
        <Stat
          label="Créances clients (AR)"
          value={`${k.arUsd.toFixed(0)} USD`}
          hint={`${k.arCdf.toLocaleString("fr-CD")} CDF`}
        />
        <Stat
          label="Dettes fournisseurs (AP)"
          value={`${k.apUsd.toFixed(0)} USD`}
          hint={`${k.apCdf.toLocaleString("fr-CD")} CDF`}
        />
        <Stat
          label="Encaissements"
          value={`${k.cashCollectedUsd.toFixed(0)} USD`}
          hint={`BFR net ${k.netWorkingCapitalUsd.toFixed(0)} USD`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Commandes ouvertes" value={String(dash.counts.openSalesOrders)} />
        <MiniStat label="BC ouverts" value={String(dash.counts.openPurchaseOrders)} />
        <MiniStat label="Factures" value={String(dash.counts.invoices)} />
        <MiniStat label="Alertes stock" value={String(dash.counts.lowStock)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/gestion/recettes" className={cn(buttonVariants(), "bg-copper text-accent-foreground")}>
          Recettes
        </Link>
        <Link
          href="/gestion/rentabilite"
          className={cn(buttonVariants({ variant: "outline" }), "border-white/20 bg-transparent text-sand")}
        >
          Rentabilité
        </Link>
        <Link
          href="/gestion/ventes"
          className={cn(buttonVariants({ variant: "outline" }), "border-white/20 bg-transparent text-sand")}
        >
          Ventes
        </Link>
        <Link
          href="/gestion/achats"
          className={cn(buttonVariants({ variant: "outline" }), "border-white/20 bg-transparent text-sand")}
        >
          Achats
        </Link>
        <Link
          href="/gestion/stock"
          className={cn(buttonVariants({ variant: "outline" }), "border-white/20 bg-transparent text-sand")}
        >
          Stock
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-white">Top produits (profit réalisé)</h2>
          <div className="mt-3 space-y-2">
            {dash.topProducts.length === 0 ? (
              <p className="text-sm text-sand/55">Pas encore de ventes facturées.</p>
            ) : (
              dash.topProducts.map((p) => (
                <div key={p.key} className="border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <p className="font-medium text-sand">
                    {p.secondary} · {p.label}
                  </p>
                  <p className="text-sand/55">
                    Profit {p.grossProfit.toFixed(2)} USD · marge {p.marginPct.toFixed(1)}% · CA{" "}
                    {p.revenue.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl text-white">Top clients</h2>
          <div className="mt-3 space-y-2">
            {dash.topCustomers.length === 0 ? (
              <p className="text-sm text-sand/55">Aucun client facturé.</p>
            ) : (
              dash.topCustomers.map((c) => (
                <div key={c.key} className="border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <p className="font-medium text-sand">{c.label}</p>
                  <p className="text-sand/55">
                    Profit {c.grossProfit.toFixed(2)} USD · marge {c.marginPct.toFixed(1)}% ·{" "}
                    {c.invoiceCount} facture(s)
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {dash.byActivity.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-white">Marge par activité</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {dash.byActivity.map((a) => (
              <div key={a.key} className="border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <p className="font-medium text-sand">{a.label}</p>
                <p className="text-sand/55">
                  CA {a.revenue.toFixed(2)} · profit {a.grossProfit.toFixed(2)} · {a.marginPct.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wider text-sand/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-sand/45">{hint}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-sand/50">{label}</p>
      <p className="mt-1 font-display text-xl text-white">{value}</p>
    </div>
  );
}
