import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { getCurrencySettings, listWarehouses } from "@/lib/masters";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Paramètres" };

export default async function ParametresPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  const [currency, warehouses] = await Promise.all([getCurrencySettings(), listWarehouses()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Paramètres</h1>
        <p className="mt-2 text-sm text-sand/65">
          Devises, taux de change historiques et entrepôts. Les taux ne sont jamais écrasés.
        </p>
      </div>

      <section className="border border-white/10 bg-white/5 p-5">
        <h2 className="font-display text-xl text-white">Devises</h2>
        <p className="mt-2 text-sm text-sand/70">Devise de base : {currency.baseCurrency}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {currency.rates.map((r) => (
            <li key={r.id} className="text-sand/80">
              1 {r.from} = {r.rate.toLocaleString("fr-CD")} {r.to} · {formatDate(r.effectiveAt)}
              {r.source ? ` · ${r.source}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-white/10 bg-white/5 p-5">
        <h2 className="font-display text-xl text-white">Entrepôts</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {warehouses.map((w) => (
            <li key={w.id} className="text-sand/80">
              <strong className="text-white">{w.code}</strong> — {w.name} ({w.city})
              {w.isDefault ? " · défaut" : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-dashed border-white/15 p-5 text-sm text-sand/60">
        Prochaine vague : rôles RBAC complets, achats, mouvements de stock, ventes. Voir{" "}
        <code className="text-sand/80">docs/SAGE_PHASE0_AUDIT.md</code>.
      </section>
    </div>
  );
}
