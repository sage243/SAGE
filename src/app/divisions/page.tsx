import Link from "next/link";
import type { Metadata } from "next";
import { DIVISIONS } from "@/lib/divisions";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Divisions",
  description: "Lignes d’activité SAGE selon l’Article 2 des statuts.",
};

export default function DivisionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Article 2</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-sage-deep">
        Divisions opérationnelles
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Chaque division reprend littéralement l’objet social, avec une lecture business :
        priorité, cycle de cash et usage digital réaliste.
      </p>

      <div className="mt-12 space-y-0">
        {DIVISIONS.map((division) => (
          <Link
            key={division.slug}
            href={`/divisions/${division.slug}`}
            className="group grid gap-4 border-t border-primary/15 py-8 transition-colors hover:bg-white/50 md:grid-cols-[180px_1fr_140px] md:items-start"
          >
            <div>
              <span
                className="mb-3 inline-block size-3 rounded-full"
                style={{ backgroundColor: division.accent }}
              />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Priorité {division.priority} · Phase {division.phase}
              </p>
              <p className="mt-1 text-sm text-foreground/70">Cycle {division.cashCycle}</p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-sage-deep group-hover:text-primary">
                {division.name}
              </h2>
              <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
                « {division.article2} »
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">{division.summary}</p>
              <p className="mt-3 text-sm text-primary">{division.digitalFit}</p>
            </div>
            <div className="md:text-right">
              <Badge variant="outline">Ouvrir →</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
