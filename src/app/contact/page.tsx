import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Coordonnées du siège SAGE SARL à Kinshasa-Gombe.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">SAGE SARL</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-sage-deep">
            Contact & siège
          </h1>
        </div>
        <Image
          src="/brand/sage-sceau.webp"
          alt="Sceau officiel SAGE SARL"
          width={120}
          height={120}
          className="h-24 w-24 rounded-full bg-white object-contain p-1 shadow-sm ring-1 ring-primary/10"
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Siège social
            </p>
            <p className="mt-2 text-base leading-relaxed">
              644, Avenue Tombalbaye
              <br />
              Immeuble Masamba, 1er étage, Local 1
              <br />
              Commune de la Gombe, Kinshasa / RDC
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Coordonnées
            </p>
            <p className="mt-2 text-base leading-relaxed">
              Tél. :{" "}
              <a className="text-primary hover:underline" href="tel:+243860619094">
                +243 860 619 094
              </a>{" "}
              /{" "}
              <a className="text-primary hover:underline" href="tel:+243995476748">
                995 476 748
              </a>
              <br />
              E-mail :{" "}
              <a className="text-primary hover:underline" href="mailto:info@sage-rdc.com">
                info@sage-rdc.com
              </a>
              <br />
              Web :{" "}
              <a className="text-primary hover:underline" href="https://sage-rdc.com">
                www.sage-rdc.com
              </a>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Forme & capital
            </p>
            <p className="mt-2 text-base leading-relaxed">
              Société à responsabilité limitée (OHADA)
              <br />
              Capital : équivalent de 5&nbsp;000&nbsp;USD (100 parts)
              <br />
              Gérant : SELEMANI AMISI Germain
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Canal digital recommandé
            </p>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Pour toute demande commerciale liée à l’objet social, utilisez le formulaire de
              devis — cela alimente directement le pipeline de la console.
            </p>
            <Link href="/devis" className={cn(buttonVariants({ size: "lg" }), "mt-4 inline-flex")}>
              Ouvrir le formulaire
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden bg-sage-deep text-sand">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative flex h-full flex-col justify-end p-8">
            <Image
              src="/brand/sage-mark.webp"
              alt=""
              width={72}
              height={72}
              className="mb-4 h-14 w-14 object-contain brightness-0 invert"
            />
            <p className="font-display text-3xl font-semibold">Kinshasa — Gombe</p>
            <p className="mt-2 max-w-sm text-sm text-sand/80">
              Hub commercial pour servir Kinshasa et rayonner vers les provinces, conformément à
              l’ambition multi-secteur de SAGE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
