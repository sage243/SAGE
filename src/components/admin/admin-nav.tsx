"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/produits", label: "Produits & services" },
  { href: "/admin/demandes", label: "Demandes" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-sand/65 hover:bg-white/5 hover:text-sand",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
