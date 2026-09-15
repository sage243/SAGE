import { redirect } from "next/navigation";

export default function AdminProduitsRedirect() {
  redirect("/gestion/produits");
}
