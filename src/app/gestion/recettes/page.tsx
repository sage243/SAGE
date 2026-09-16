import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { RecipesManager } from "@/components/gestion/recipes-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recettes — Gestion SAGE",
};

export default async function RecettesPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <RecipesManager />;
}
