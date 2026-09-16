import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  priority = false,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const url = src || "/products/placeholder-shelf.jpg";

  return (
    <div className={cn("relative overflow-hidden bg-[#e8f4fb]", className)}>
      <Image
        src={url}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sage-deep/35 via-transparent to-transparent opacity-80" />
    </div>
  );
}
