"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIVISIONS } from "@/lib/divisions";
import { cn } from "@/lib/utils";

export function CatalogueFilters({
  division,
  kind,
  category,
  q,
  categories,
  total,
}: {
  division?: string;
  kind?: string;
  category?: string;
  q?: string;
  categories: string[];
  total: number;
}) {
  const router = useRouter();

  function push(next: { division?: string; kind?: string; category?: string; q?: string }) {
    const params = new URLSearchParams();
    const d = next.division !== undefined ? next.division : division;
    const k = next.kind !== undefined ? next.kind : kind;
    const c = next.category !== undefined ? next.category : category;
    const query = next.q !== undefined ? next.q : q;
    if (d) params.set("division", d);
    if (k) params.set("kind", k);
    if (c) params.set("category", c);
    if (query) params.set("q", query);
    const qs = params.toString();
    router.push(qs ? `/catalogue?${qs}` : "/catalogue");
  }

  return (
    <div className="mt-8 space-y-5">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          push({ q: String(fd.get("q") || "").trim() || undefined });
        }}
      >
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Rechercher marque, SKU, produit…"
          className="h-11 flex-1 border border-primary/15 bg-white/80 px-4 text-sm outline-none transition focus:border-copper"
        />
        <button
          type="submit"
          className="h-11 bg-sage px-5 text-sm font-semibold text-sand transition hover:bg-sage-deep"
        >
          Chercher
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!division} onClick={() => push({ division: "" })}>
          Toutes divisions
        </FilterChip>
        {DIVISIONS.filter((d) => d.priority === 1 || d.slug === "commerce-general").map((d) => (
          <FilterChip
            key={d.slug}
            active={division === d.slug}
            onClick={() => push({ division: d.slug })}
          >
            {d.shortName}
          </FilterChip>
        ))}
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!category} onClick={() => push({ category: "" })}>
            Toutes catégories
          </FilterChip>
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              active={category === cat}
              onClick={() => push({ category: cat })}
            >
              {cat}
            </FilterChip>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!kind} onClick={() => push({ kind: "" })}>
            Tous
          </FilterChip>
          <FilterChip active={kind === "product"} onClick={() => push({ kind: "product" })}>
            Produits
          </FilterChip>
          <FilterChip active={kind === "service"} onClick={() => push({ kind: "service" })}>
            Services
          </FilterChip>
        </div>
        <p className="text-sm text-muted-foreground">
          {total} offre{total > 1 ? "s" : ""}
          {q || category || division ? (
            <>
              {" · "}
              <Link href="/catalogue" className="font-medium text-primary hover:underline">
                Réinitialiser
              </Link>
            </>
          ) : null}
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
        "border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-sage bg-sage text-sand"
          : "border-primary/15 bg-white/70 text-foreground/80 hover:border-copper/50",
      )}
    >
      {children}
    </button>
  );
}
