import Link from "next/link";
import type { Metadata } from "next";
import { DIVISIONS } from "@/lib/divisions";
import { listProducts } from "@/lib/masters";
import { Badge } from "@/components/ui/badge";
import { CatalogueFilters } from "@/components/site/catalogue-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Produits et services SAGE — alimentation & distribution prioritaires.",
};

type Props = { searchParams: Promise<{ division?: string; kind?: string }> };

export default async function CataloguePage({ searchParams }: Props) {
  const params = await searchParams;
  let products = (await listProducts()).filter((p) => p.status === "active" && p.publicVisible);

  if (params.division) {
    products = products.filter((p) => p.activity === params.division);
  }
  if (params.kind === "product" || params.kind === "service") {
    products = products.filter((p) => p.kind === params.kind);
  }

  // Surface current cash-engine products first
  products = [...products].sort((a, b) => {
    const pa = DIVISIONS.find((d) => d.slug === a.activity)?.priority ?? 9;
    const pb = DIVISIONS.find((d) => d.slug === b.activity)?.priority ?? 9;
    return pa - pb;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Offre SAGE</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-sage-deep">
        Catalogue produits & services
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Priorité opérationnelle : alimentation (tarifs Marsavco & Beltexco) et distribution de
        vivres. Les autres activités Article 2 restent visibles mais non opérationnalisées.
      </p>

      <CatalogueFilters division={params.division} kind={params.kind} total={products.length} />

      {products.length === 0 ? (
        <div className="mt-12 border border-dashed border-primary/20 p-10 text-center">
          <p className="font-display text-xl text-sage-deep">Aucune offre pour ce filtre</p>
          <Link href="/catalogue" className="mt-4 inline-block text-sm font-semibold text-primary">
            Réinitialiser
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const division = DIVISIONS.find((d) => d.slug === product.activity);
            const isCurrent = (division?.priority ?? 9) === 1;
            return (
              <article
                key={product.id}
                className="flex flex-col border border-primary/10 bg-white/70 p-5"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{division?.shortName}</Badge>
                  <Badge variant="outline">
                    {product.kind === "product" ? "Produit" : "Service"}
                  </Badge>
                  <Badge variant={isCurrent ? "default" : "outline"}>
                    {isCurrent ? "Activité actuelle" : "Développement"}
                  </Badge>
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold text-sage-deep">
                  {product.name}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-primary/10 pt-4">
                  <p className="text-sm font-semibold text-copper">{product.priceLabel}</p>
                  <Link
                    href={`/devis?division=${product.activity}&offer=${product.id}`}
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
