import { redirect } from "next/navigation";
import { isGestionAuthenticated } from "@/lib/auth";
import { GestionLoginForm } from "@/components/gestion/login-form";

export default async function GestionLoginPage() {
  if (await isGestionAuthenticated()) {
    redirect("/gestion");
  }
  return <GestionLoginForm />;
}
