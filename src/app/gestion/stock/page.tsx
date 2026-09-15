import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { StockManager } from "@/components/gestion/stock-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stock — Gestion SAGE",
};

export default async function StockPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <StockManager />;
}
