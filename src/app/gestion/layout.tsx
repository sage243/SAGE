import Link from "next/link";
import { isGestionAuthenticated } from "@/lib/auth";
import { GestionNav } from "@/components/gestion/gestion-nav";
import { LogoutButton } from "@/components/gestion/logout-button";

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const ok = await isGestionAuthenticated();

  return (
    <div className="min-h-screen bg-[#0b2a18] text-sand">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <Link href="/gestion" className="font-display text-2xl font-semibold text-sand">
              SAGE Gestion
            </Link>
            <span className="hidden text-xs uppercase tracking-[0.16em] text-sand/50 sm:inline">
              Alimentation & distribution
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-sand/70 hover:text-white">
              Site public
            </Link>
            {ok ? <LogoutButton /> : null}
          </div>
        </div>
      </div>
      {ok ? (
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr] sm:px-6">
          <GestionNav />
          <div className="min-w-0">{children}</div>
        </div>
      ) : (
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">{children}</div>
      )}
    </div>
  );
}
