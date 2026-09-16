import Link from "next/link";
import type { Metadata } from "next";
import { DIVISIONS } from "@/lib/divisions";
import { listProducts } from "@/lib/masters";
import { CatalogueFilters } from "@/components/site/catalogue-filters";
import { ProductCard } from "@/components/site/product-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Catalogue SAGE — savonnerie, détergents, épicerie, vivres et distribution. Tarifs Marsavco & Beltexco.",
};

type Props = {
  searchParams: Promise<{ division?: string; kind?: string; category?: string; q?: string }>;
};

export default async function CataloguePage({ searchParams }: Props) {
  const params = await searchParams;
  const all = (await listProducts()).filter((p) => p.status === "active" && p.publicVisible);

  let products = all;
  if (params.division) products = products.filter((p) => p.activity === params.division);
  if (params.kind === "product" || params.kind === "service") {
    products = products.filter((p) => p.kind === params.kind);
  }
  if (params.category) products = products.filter((p) => p.category === params.category);
  if (params.q) {
    const q = params.q.toLowerCase();
    products = products.filter((p) =>
      [p.name, p.sku, p.brand, p.category, p.subcategory, p.description, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  products = [...products].sort((a, b) => {
    const pa = DIVISIONS.find((d) => d.slug === a.activity)?.priority ?? 9;
    const pb = DIVISIONS.find((d) => d.slug === b.activity)?.priority ?? 9;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, "fr");
  });

  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  return (
    <div>
      <section className="relative overflow-hidden border-b border-primary/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(5,46,22,0.92) 0%, rgba(5,46,22,0.72) 45%, rgba(5,46,22,0.35) 100%), url(/products/VIV-RIZ-25.jpg)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="animate-fade text-xs font-semibold uppercase tracking-[0.24em] text-copper">
            SAGE · Kinshasa
          </p>
          <h1 className="animate-rise mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-sand sm:text-5xl">
            Catalogue
          </h1>
          <p className="animate-rise-delay mt-4 max-w-xl text-base leading-relaxed text-sand/80">
            Alimentation, entretien et vivres — packshots et tarifs pour commander rapidement.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <CatalogueFilters
          division={params.division}
          kind={params.kind}
          category={params.category}
          q={params.q}
          categories={categories}
          total={products.length}
        />

        {products.length === 0 ? (
          <div className="mt-12 border border-dashed border-primary/20 px-6 py-14 text-center">
            <p className="font-display text-2xl text-sage-deep">Aucun produit pour ce filtre</p>
            <Link href="/catalogue" className="mt-4 inline-block text-sm font-semibold text-primary">
              Voir tout le catalogue
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 3} />
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Besoin d’un volume ou d’un panier sur mesure ?{" "}
          <Link href="/devis" className="font-semibold text-primary hover:underline">
            Demander un devis
          </Link>
        </p>
      </div>
    </div>
  );
}
