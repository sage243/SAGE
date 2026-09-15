import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { PurchasesManager } from "@/components/gestion/purchases-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Achats — Gestion SAGE",
};

export default async function AchatsPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <PurchasesManager />;
}
