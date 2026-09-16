import Link from "next/link";
import type { Product } from "@/lib/domain";
import { DIVISIONS } from "@/lib/divisions";
import { ProductImage } from "@/components/site/product-image";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const division = DIVISIONS.find((d) => d.slug === product.activity);

  return (
    <Link
      href={`/catalogue/${encodeURIComponent(product.sku)}`}
      className={cn(
        "group flex flex-col overflow-hidden border border-primary/10 bg-white/75 outline-none transition hover:border-copper/40 focus-visible:ring-2 focus-visible:ring-copper",
        className,
      )}
    >
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        priority={priority}
        className="aspect-[4/3] w-full"
      />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {product.brand ? <span className="text-copper">{product.brand}</span> : null}
          {product.brand && product.category ? <span aria-hidden>·</span> : null}
          <span>{product.category}</span>
        </div>
        <h3 className="mt-2 font-display text-lg leading-snug font-semibold text-sage-deep sm:text-xl">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-primary/10 pt-3">
          <div>
            <p className="text-sm font-semibold text-copper">{product.priceLabel}</p>
            {division ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{division.shortName}</p>
            ) : null}
          </div>
          <span className="text-sm font-semibold text-primary transition group-hover:text-copper">
            Voir →
          </span>
        </div>
      </div>
    </Link>
  );
}
