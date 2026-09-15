import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isGestionAuthenticated } from "@/lib/auth";
import { CustomersManager } from "@/components/gestion/customers-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  if (!(await isGestionAuthenticated())) redirect("/gestion/login");
  return <CustomersManager />;
}
