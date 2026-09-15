"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIVISIONS } from "@/lib/divisions";
import { cn } from "@/lib/utils";

export function CatalogueFilters({
  division,
  kind,
  total,
}: {
  division?: string;
  kind?: string;
  total: number;
}) {
  const router = useRouter();

  function setParam(key: string, value?: string) {
    const params = new URLSearchParams();
    const nextDivision = key === "division" ? value : division;
    const nextKind = key === "kind" ? value : kind;
    if (nextDivision) params.set("division", nextDivision);
    if (nextKind) params.set("kind", nextKind);
    const qs = params.toString();
    router.push(qs ? `/catalogue?${qs}` : "/catalogue");
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip active={!division} onClick={() => setParam("division", undefined)}>
          Toutes divisions
        </FilterChip>
        {DIVISIONS.map((d) => (
          <FilterChip
            key={d.slug}
            active={division === d.slug}
            onClick={() => setParam("division", d.slug)}
          >
            {d.shortName}
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!kind} onClick={() => setParam("kind", undefined)}>
            Tous
          </FilterChip>
          <FilterChip active={kind === "product"} onClick={() => setParam("kind", "product")}>
            Produits
          </FilterChip>
          <FilterChip active={kind === "service"} onClick={() => setParam("kind", "service")}>
            Services
          </FilterChip>
        </div>
        <p className="text-sm text-muted-foreground">
          {total} offre{total > 1 ? "s" : ""} ·{" "}
          <Link href="/gestion/produits" className="font-medium text-primary hover:underline">
            Gérer
          </Link>
        </p>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/15 bg-white/60 text-foreground/80 hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
