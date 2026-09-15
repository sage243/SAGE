"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/gestion", label: "Tableau de bord", exact: true },
  { href: "/gestion/clients", label: "Clients" },
  { href: "/gestion/fournisseurs", label: "Fournisseurs" },
  { href: "/gestion/produits", label: "Produits" },
  { href: "/gestion/parametres", label: "Paramètres" },
  { href: "/admin/demandes", label: "Demandes (legacy)" },
];

export function GestionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
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
