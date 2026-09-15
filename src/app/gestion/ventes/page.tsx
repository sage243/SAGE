import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { SalesManager } from "@/components/gestion/sales-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ventes — Gestion SAGE",
};

export default async function VentesPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <SalesManager />;
}
