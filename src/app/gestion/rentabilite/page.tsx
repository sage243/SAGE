import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { ProfitabilityManager } from "@/components/gestion/profitability-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rentabilité — Gestion SAGE",
};

export default async function RentabilitePage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <ProfitabilityManager />;
}
