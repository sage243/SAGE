import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b2a18] text-sand">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <Link href="/admin" className="font-display text-2xl font-semibold text-sand">
              SAGE Ops
            </Link>
            <span className="hidden text-xs uppercase tracking-[0.16em] text-sand/50 sm:inline">
              Console commerciale
            </span>
          </div>
          <Link href="/" className="text-sm text-sand/70 hover:text-white">
            ← Site public
          </Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr] sm:px-6">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
