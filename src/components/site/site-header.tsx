"use client";

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
  { href: "/divisions", label: "Divisions" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/devis", label: "Demande" },
  { href: "/plan", label: "Plan réaliste" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-[#f7f4ee]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-primary">
            SAGE
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            Save Africa Group
          </span>
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
            href="/admin"
            className={cn(
              buttonVariants({ size: "sm" }),
              "ml-2 bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            Console
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
                <SheetTitle className="font-display text-left text-primary">SAGE</SheetTitle>
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
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md bg-primary px-3 py-3 text-base font-medium text-primary-foreground"
                >
                  Console ops
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
