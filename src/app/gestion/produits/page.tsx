import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { ProductsMasterManager } from "@/components/gestion/products-master-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Produits" };

export default async function ProduitsPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <ProductsMasterManager />;
}
