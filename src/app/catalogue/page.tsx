import Link from "next/link";
import type { Metadata } from "next";
import { DIVISIONS } from "@/lib/divisions";
import { listOffers } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { CatalogueFilters } from "@/components/site/catalogue-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Produits et services SAGE par division.",
};

type Props = { searchParams: Promise<{ division?: string; kind?: string }> };

export default async function CataloguePage({ searchParams }: Props) {
  const params = await searchParams;
  let offers = (await listOffers()).filter((o) => o.status === "active");

  if (params.division) {
    offers = offers.filter((o) => o.division === params.division);
  }
  if (params.kind === "product" || params.kind === "service") {
    offers = offers.filter((o) => o.kind === params.kind);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Offre SAGE</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-sage-deep">
        Catalogue produits & services
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Vitrine unique multi-divisions. Les prix affichés sont indicatifs ; la plupart des
        opérations B2B passent par devis.
      </p>

      <CatalogueFilters
        division={params.division}
        kind={params.kind}
        total={offers.length}
      />

      {offers.length === 0 ? (
        <div className="mt-12 border border-dashed border-primary/20 p-10 text-center">
          <p className="font-display text-xl text-sage-deep">Aucune offre pour ce filtre</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Essayez une autre division ou réinitialisez les filtres.
          </p>
          <Link href="/catalogue" className="mt-4 inline-block text-sm font-semibold text-primary">
            Réinitialiser
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const division = DIVISIONS.find((d) => d.slug === offer.division);
            return (
              <article
                key={offer.id}
                className="flex flex-col border border-primary/10 bg-white/70 p-5 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(20,83,45,0.45)]"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{division?.shortName}</Badge>
                  <Badge variant="outline">
                    {offer.kind === "product" ? "Produit" : "Service"}
                  </Badge>
                  {offer.featured && <Badge className="bg-copper text-accent-foreground">Prioritaire</Badge>}
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold text-sage-deep">
                  {offer.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {offer.description}
                </p>
                {offer.stockNote && (
                  <p className="mt-3 text-xs text-foreground/70">Stock : {offer.stockNote}</p>
                )}
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-primary/10 pt-4">
                  <p className="text-sm font-semibold text-copper">{offer.priceLabel}</p>
                  <Link
                    href={`/devis?division=${offer.division}&offer=${offer.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Demander →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
