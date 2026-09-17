"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/divisions", label: "Activités" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/devis", label: "Devis" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/gestion");

  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-[#f5f8fb]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5" aria-label="SAGE — Accueil">
          <Image
            src="/brand/sage-logo.webp"
            alt="SAGE SARL — Excellence · Intégrité · Innovation · Impact"
            width={320}
            height={82}
            priority
            className="h-11 w-auto max-w-[min(100%,280px)] object-contain object-left sm:h-14 sm:max-w-[340px]"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/75 hover:bg-secondary hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/gestion"
            className={cn(
              buttonVariants({ size: "sm" }),
              "ml-2 bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            Gestion
          </Link>
        </nav>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="outline" size="icon" aria-label="Menu" />}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Image
                    src="/brand/sage-mark.webp"
                    alt="SAGE"
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain"
                  />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1 px-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/gestion"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md bg-primary px-3 py-3 text-base font-medium text-primary-foreground"
                >
                  Espace gestion
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
