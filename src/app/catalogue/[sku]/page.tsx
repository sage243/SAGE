import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DIVISIONS } from "@/lib/divisions";
import { getProductBySku, listProducts } from "@/lib/masters";
import { ProductImage } from "@/components/site/product-image";
import { ProductCard } from "@/components/site/product-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ sku: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product || product.status !== "active" || !product.publicVisible) notFound();

  const division = DIVISIONS.find((d) => d.slug === product.activity);
  const related = (await listProducts())
    .filter(
      (p) =>
        p.id !== product.id &&
        p.status === "active" &&
        p.publicVisible &&
        (p.category === product.category || p.brand === product.brand),
    )
    .slice(0, 3);

  return (
    <div>
      <div className="border-b border-primary/10 bg-white/50">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 text-sm sm:px-6">
          <Link href="/catalogue" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" />
            Catalogue
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="truncate text-sage-deep">{product.sku}</span>
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-2">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          priority
          className="min-h-[320px] aspect-[4/3] w-full lg:min-h-[560px] lg:aspect-auto"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
          <p className="animate-fade text-xs font-semibold uppercase tracking-[0.2em] text-copper">
            {[product.brand, product.category].filter(Boolean).join(" · ")}
          </p>
          <h1 className="animate-rise mt-3 font-display text-3xl font-semibold tracking-tight text-sage-deep sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{product.sku}</p>
          <p className="animate-rise-delay mt-5 text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Prix indicatif</dt>
              <dd className="mt-1 font-semibold text-copper">{product.priceLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Unité</dt>
              <dd className="mt-1 font-semibold text-sage-deep">{product.unitOfMeasure}</dd>
            </div>
            {product.subcategory ? (
              <div>
                <dt className="text-muted-foreground">Sous-catégorie</dt>
                <dd className="mt-1 font-semibold text-sage-deep">{product.subcategory}</dd>
              </div>
            ) : null}
            {division ? (
              <div>
                <dt className="text-muted-foreground">Activité</dt>
                <dd className="mt-1 font-semibold text-sage-deep">{division.shortName}</dd>
              </div>
            ) : null}
            {product.stockNote ? (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Conditionnement</dt>
                <dd className="mt-1 font-semibold text-sage-deep">{product.stockNote}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/devis?division=${product.activity}&offer=${product.id}`}
              className={cn(buttonVariants({ size: "lg" }), "bg-copper text-accent-foreground hover:bg-copper/90")}
            >
              Demander un devis
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/catalogue" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Continuer le catalogue
            </Link>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="border-t border-primary/10 bg-white/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-sage-deep">Dans la même gamme</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
