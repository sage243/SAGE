import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { getInventorySnapshot } from "@/lib/inventory";
import { getGestionDashboard } from "@/lib/masters";
import { listPurchaseOrders } from "@/lib/procurement";
import { getSalesDashboard } from "@/lib/sales";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestion SAGE",
};

export default async function GestionDashboardPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");

  const [dash, inv, orders, sales] = await Promise.all([
    getGestionDashboard(),
    getInventorySnapshot(),
    listPurchaseOrders(),
    getSalesDashboard(),
  ]);
  const openPos = orders.filter(
    (p) => p.status === "draft" || p.status === "approved" || p.status === "partial",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Tableau de bord</h1>
        <p className="mt-2 text-sm text-sand/65">
          Phase 3 — alimentation : achats, stock, ventes (devis → commande → livraison → facture).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Produits actifs" value={String(dash.counts.products)} />
        <Stat label="Valeur stock (coût réel)" value={`${dash.inventoryValueUsd.toFixed(0)} ${dash.baseCurrency}`} />
        <Stat label="BC ouverts" value={String(openPos)} />
        <Stat label="Commandes ouvertes" value={String(sales.counts.openOrders)} />
        <Stat label="CA facturé" value={`${sales.salesInvoicedUsd.toFixed(0)} USD`} />
        <Stat label="Créances (AR)" value={`${sales.arBalanceUsd.toFixed(0)} USD`} />
      </div>

      {dash.fx && (
        <p className="text-sm text-sand/70">
          FX actuel : 1 {dash.fx.from} = {dash.fx.rate.toLocaleString("fr-CD")} {dash.fx.to}{" "}
          <span className="text-sand/45">(historique conservé — non écrasé)</span>
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/gestion/ventes" className={cn(buttonVariants(), "bg-copper text-accent-foreground")}>
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
          Stock ({inv.movementCount} mvts)
        </Link>
        <Link
          href="/gestion/produits"
          className={cn(buttonVariants({ variant: "outline" }), "border-white/20 bg-transparent text-sand")}
        >
          Produits
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-white">Alertes stock</h2>
          <div className="mt-3 space-y-2">
            {dash.lowStock.length === 0 ? (
              <p className="text-sm text-sand/55">Aucune alerte pour le moment.</p>
            ) : (
              dash.lowStock.map((p) => (
                <div key={p.id} className="border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <p className="font-medium text-sand">{p.name}</p>
                  <p className="text-sand/55">
                    {p.quantityOnHand} {p.unitOfMeasure} · seuil {p.reorderLevel}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl text-white">Meilleures marges unitaires</h2>
          <div className="mt-3 space-y-2">
            {dash.topMargins.map((p) => (
              <div key={p.id} className="border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <p className="font-medium text-sand">{p.name}</p>
                <p className="text-sand/55">
                  Marge {p.marginPct.toFixed(1)}% · profit {p.grossProfit.toFixed(2)} USD
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wider text-sand/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
