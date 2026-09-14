import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DIVISIONS } from "@/lib/divisions";
import { listOffers } from "@/lib/store";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const offers = (await listOffers()).filter((o) => o.status === "active" && o.featured).slice(0, 3);

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
            Plateforme unique pour publier, cotationner et suivre les produits et services de
            SAGE — alignée sur l’objet social de l’Article 2.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className={cn(buttonVariants({ size: "lg" }), "bg-copper text-accent-foreground hover:bg-copper/90")}
            >
              Voir le catalogue
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/plan"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-sand/40 bg-transparent text-sand hover:bg-white/10 hover:text-white",
              )}
            >
              Plan réaliste
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Article 2</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-sage-deep sm:text-4xl">
            Six lignes d’activité, une console.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Avec un capital de 5&nbsp;000&nbsp;USD, SAGE ne digitalise pas six secteurs d’un coup.
            La plateforme unifie la vitrine et le pipeline commercial, puis priorise les moteurs
            de cash.
          </p>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {DIVISIONS.map((division, index) => (
            <Link
              key={division.slug}
              href={`/divisions/${division.slug}`}
              className="group border-t border-primary/15 pt-5 transition-colors hover:border-copper"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: division.accent }}
                />
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  Phase {division.phase}
                </Badge>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-sage-deep group-hover:text-primary">
                {division.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {division.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="texture-grid border-y border-primary/10 bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                Offres prioritaires
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-sage-deep">
                Ce qui peut générer du cash maintenant
              </h2>
            </div>
            <Link href="/catalogue" className="text-sm font-semibold text-primary hover:underline">
              Catalogue complet →
            </Link>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {offers.map((offer) => {
              const division = DIVISIONS.find((d) => d.slug === offer.division);
              return (
                <article key={offer.id} className="border-l-2 border-primary/30 pl-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {division?.shortName} · {offer.kind === "product" ? "Produit" : "Service"}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-sage-deep">
                    {offer.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {offer.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-copper">{offer.priceLabel}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
              Fonctionnalités Phase 1
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-sage-deep sm:text-4xl">
              Gérer l’offre SAGE en ligne, sans surinvestir.
            </h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-foreground/85">
              <li>— Catalogue multi-divisions (produits & services)</li>
              <li>— Demandes de devis / leads avec pipeline commercial</li>
              <li>— Console ops pour publier, archiver et prioriser</li>
              <li>— Feuille de route réaliste liée au capital et à l’Article 2</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/devis" className={cn(buttonVariants({ size: "lg" }))}>
                Faire une demande
              </Link>
              <Link href="/admin" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
                Ouvrir la console
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-sm bg-sage-deep p-8 text-sand shadow-[0_24px_60px_-30px_rgba(5,46,22,0.65)]">
            <div className="absolute -right-8 -top-8 size-40 rounded-full bg-copper/20 blur-2xl" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-copper">
              Principe directeur
            </p>
            <p className="relative mt-4 font-display text-2xl leading-snug font-semibold">
              Une plateforme corporate d’abord. Le e-commerce vertical vient après les premiers
              flux de trésorerie.
            </p>
            <p className="relative mt-4 text-sm leading-relaxed text-sand/75">
              Objectif : centraliser la demande commerciale de SAGE tout en séquençant les
              investissements digitaux selon le cycle de cash de chaque division.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
