import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DIVISIONS } from "@/lib/divisions";
import { listProducts } from "@/lib/masters";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/site/product-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const current = DIVISIONS.filter((d) => d.priority === 1);
  const future = DIVISIONS.filter((d) => d.priority !== 1);
  const all = (await listProducts()).filter((p) => p.status === "active" && p.publicVisible);
  const featured = (
    all.filter((p) => p.featured).length >= 3
      ? all.filter((p) => p.featured)
      : all.filter((p) => p.kind === "product")
  ).slice(0, 6);

  return (
    <>
      <section className="hero-wash relative min-h-[calc(100svh-4rem)] overflow-hidden text-sand">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(184,115,51,0.25),transparent_40%)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-end px-4 pb-16 pt-20 sm:px-6 sm:pb-20">
          <p className="animate-fade text-xs font-semibold uppercase tracking-[0.28em] text-copper">
            Kinshasa · SARL OHADA
          </p>
          <h1 className="animate-rise mt-4 max-w-4xl font-display text-5xl leading-[0.95] font-semibold tracking-tight sm:text-6xl md:text-7xl">
            SAVE AFRICA GROUP
            <span className="block text-copper">FOR EXCELLENCE</span>
          </h1>
          <p className="animate-rise-delay mt-5 max-w-xl text-base leading-relaxed text-sand/85 sm:text-lg">
            Alimentation et distribution de vivres d’abord — avec une plateforme de gestion pour
            vendre, stocker, livrer et encaisser.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-copper text-accent-foreground hover:bg-copper/90",
              )}
            >
              Catalogue actuel
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/gestion"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-sand/40 bg-transparent text-sand hover:bg-white/10 hover:text-white",
              )}
            >
              Espace gestion
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
          Activités actuelles
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-sage-deep sm:text-4xl">
          Le moteur de cash SAGE
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Priorité 1 : alimentation (Marsavco & Beltexco) et distribution urbaine de vivres /
          restauration — cycles de trésorerie courts.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {current.map((division) => (
            <Link
              key={division.slug}
              href={`/divisions/${division.slug}`}
              className="border-t-2 border-copper pt-5"
            >
              <h3 className="font-display text-2xl font-semibold text-sage-deep">{division.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{division.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="texture-grid border-y border-primary/10 bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                Sélection catalogue
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-sage-deep">
                Produits en image
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Chaque référence a un visuel — parcourez le catalogue, filtrez, demandez un devis.
              </p>
            </div>
            <Link href="/catalogue" className="text-sm font-semibold text-primary hover:underline">
              Catalogue complet →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 3} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
          Activités futures
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-sage-deep">
          Article 2 — développement ultérieur
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Voyage, pharma/pétrole, agro et immobilier restent dans l’objet social mais ne sont pas
          opérationnalisés dans la plateforme pour l’instant.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {future.map((d) => (
            <Badge key={d.slug} variant="outline" className="px-3 py-1.5 text-sm">
              {d.shortName}
            </Badge>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/devis" className={cn(buttonVariants({ size: "lg" }))}>
            Demander un devis
          </Link>
          <Link href="/plan" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            Voir le plan
          </Link>
        </div>
      </section>
    </>
  );
}
