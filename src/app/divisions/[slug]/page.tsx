import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDivision, DIVISIONS } from "@/lib/divisions";
import { listOffers } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return DIVISIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const division = getDivision(slug);
  return { title: division?.name ?? "Division" };
}

export default async function DivisionDetailPage({ params }: Props) {
  const { slug } = await params;
  const division = getDivision(slug);
  if (!division) notFound();

  const offers = (await listOffers()).filter(
    (o) => o.division === division.slug && o.status === "active",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Link href="/divisions" className="text-sm font-medium text-primary hover:underline">
        ← Toutes les divisions
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Phase {division.phase}</Badge>
            <Badge variant="secondary">Priorité {division.priority}</Badge>
            <Badge variant="outline">Cash {division.cashCycle}</Badge>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-sage-deep">
            {division.name}
          </h1>
          <p className="mt-4 border-l-2 border-copper pl-4 text-sm italic leading-relaxed text-muted-foreground">
            {division.article2}
          </p>
          <p className="mt-6 text-base leading-relaxed text-foreground/85">{division.summary}</p>
          <p className="mt-4 text-sm leading-relaxed text-primary">{division.digitalFit}</p>
          <Link
            href={`/devis?division=${division.slug}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-8 inline-flex")}
          >
            Demander un devis
          </Link>
        </div>

        <aside className="bg-sage-deep p-6 text-sand">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
            Lecture business
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-relaxed text-sand/85">
            <li>
              <strong className="text-white">Quand digitaliser :</strong> Phase {division.phase} du
              plan SAGE.
            </li>
            <li>
              <strong className="text-white">Rôle actuel de la plateforme :</strong> capturer la
              demande, publier l’offre, qualifier les leads.
            </li>
            <li>
              <strong className="text-white">Pas encore :</strong> checkout automatisé, ERP ou
              stock multi-dépôts — trop lourd pour 5&nbsp;000&nbsp;USD de capital.
            </li>
          </ul>
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-sage-deep">
          Offres actives ({offers.length})
        </h2>
        {offers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune offre publiée pour cette division. Ajoutez-en depuis la console.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {offers.map((offer) => (
              <article key={offer.id} className="border border-primary/10 bg-white/60 p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {offer.kind === "product" ? "Produit" : "Service"}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold">{offer.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {offer.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-copper">{offer.priceLabel}</p>
                  <Link
                    href={`/devis?division=${division.slug}&offer=${offer.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Demander →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
