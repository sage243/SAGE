import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { CorrespondencesManager } from "@/components/gestion/correspondences-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Correspondances — Gestion SAGE",
};

export default async function CorrespondancesPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <CorrespondencesManager />;
}
