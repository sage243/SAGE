"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/gestion")) return null;

  return (
    <footer className="border-t border-primary/10 bg-sage-deep text-sand">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl font-semibold tracking-tight">SAGE SARL</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-sand/75">
            SAVE AFRICA GROUP FOR EXCELLENCE — société à responsabilité limitée basée à
            Kinshasa (Gombe), régie par l’OHADA.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper">Siège</p>
          <p className="mt-3 text-sm leading-relaxed text-sand/85">
            644, Avenue Tombalbaye
            <br />
            Immeuble Masamba, 1er étage, Local 1
            <br />
            Commune de la Gombe, Kinshasa / RDC
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper">
            Plateforme
          </p>
          <ul className="mt-3 space-y-2 text-sm text-sand/85">
            <li>
              <Link href="/plan" className="hover:text-white">
                Plan réaliste
              </Link>
            </li>
            <li>
              <Link href="/catalogue" className="hover:text-white">
                Catalogue
              </Link>
            </li>
            <li>
              <Link href="/gestion" className="hover:text-white">
                Espace gestion
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-sand/55">
        Objet social conforme à l’Article 2 des statuts · Capital 5 000 USD · Premier exercice
        clos le 31/12/2026
      </div>
    </footer>
  );
}
