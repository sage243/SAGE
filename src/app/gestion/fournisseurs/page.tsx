import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { SuppliersManager } from "@/components/gestion/suppliers-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fournisseurs" };

export default async function FournisseursPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <SuppliersManager />;
}
