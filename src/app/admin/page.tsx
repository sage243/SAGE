import Link from "next/link";
import type { Metadata } from "next";
import { DIVISIONS } from "@/lib/divisions";
import { listInquiries, listOffers } from "@/lib/store";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Console ops",
};

export default async function AdminDashboardPage() {
  const [offers, inquiries] = await Promise.all([listOffers(), listInquiries()]);
  const activeOffers = offers.filter((o) => o.status === "active").length;
  const newInquiries = inquiries.filter((i) => i.status === "nouveau").length;
  const openPipeline = inquiries.filter((i) =>
    ["nouveau", "en_cours", "devis_envoye"].includes(i.status),
  ).length;

  const byDivision = DIVISIONS.map((d) => ({
    ...d,
    offers: offers.filter((o) => o.division === d.slug && o.status === "active").length,
    inquiries: inquiries.filter((i) => i.division === d.slug).length,
  }));

  const recent = inquiries.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Tableau de bord</h1>
        <p className="mt-2 text-sm text-sand/65">
          Vue ops Phase 1 — offre publiée et pipeline commercial.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Offres actives" value={String(activeOffers)} />
        <Stat label="Nouvelles demandes" value={String(newInquiries)} />
        <Stat label="Pipeline ouvert" value={String(openPipeline)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/produits"
          className={cn(buttonVariants(), "bg-copper text-accent-foreground hover:bg-copper/90")}
        >
          Gérer le catalogue
        </Link>
        <Link
          href="/admin/demandes"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-white/20 bg-transparent text-sand hover:bg-white/10 hover:text-white",
          )}
        >
          Traiter les demandes
        </Link>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold text-white">Signal par division</h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-sand/55">
              <tr>
                <th className="px-4 py-3 font-medium">Division</th>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Offres</th>
                <th className="px-4 py-3 font-medium">Demandes</th>
              </tr>
            </thead>
            <tbody>
              {byDivision.map((row) => (
                <tr key={row.slug} className="border-t border-white/10">
                  <td className="px-4 py-3 text-sand">{row.name}</td>
                  <td className="px-4 py-3 text-sand/70">{row.phase}</td>
                  <td className="px-4 py-3 text-sand/70">{row.offers}</td>
                  <td className="px-4 py-3 text-sand/70">{row.inquiries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-white">Demandes récentes</h2>
          <Link href="/admin/demandes" className="text-sm text-copper hover:underline">
            Tout voir
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-sand/60">Aucune demande pour le moment.</p>
          ) : (
            recent.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-sand">{item.fullName}</p>
                  <p className="text-xs text-sand/55">
                    {DIVISIONS.find((d) => d.slug === item.division)?.shortName} ·{" "}
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-wider text-copper">{item.status}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wider text-sand/50">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold text-white">{value}</p>
    </div>
  );
}
