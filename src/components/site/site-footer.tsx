"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/gestion")) return null;

  return (
    <footer className="border-t border-primary/10 bg-sage-deep text-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_0.9fr]">
        <div>
          <div className="inline-block rounded-md bg-white px-3 py-2">
            <Image
              src="/brand/sage-logo.webp"
              alt="SAGE SARL — Excellence · Intégrité · Innovation · Impact"
              width={280}
              height={72}
              className="h-12 w-auto object-contain object-left sm:h-14"
            />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand/75">
            SAVE AFRICA GROUP FOR EXCELLENCE — société à responsabilité limitée basée à
            Kinshasa (Gombe), régie par l’OHADA.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-copper">
            Excellence · Intégrité · Innovation · Impact
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
          <p className="mt-3 text-sm text-sand/75">
            <a href="tel:+243860619094" className="hover:text-white">
              +243 860 619 094
            </a>
            {" · "}
            <a href="mailto:info@sage-rdc.com" className="hover:text-white">
              info@sage-rdc.com
            </a>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-sand/85">
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
        <div className="flex flex-col items-start md:items-end">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper">Marque</p>
          <Image
            src="/brand/sage-mark.webp"
            alt="Marque SAGE SARL"
            width={160}
            height={160}
            className="mt-3 h-28 w-28 rounded-full bg-white object-contain p-2 shadow-sm md:h-32 md:w-32"
          />
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-sand/55">
        Objet social conforme à l’Article 2 des statuts · Capital 5 000 USD · Premier exercice
        clos le 31/12/2026
      </div>
    </footer>
  );
}
