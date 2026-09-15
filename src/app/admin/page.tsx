import Link from "next/link";
import { redirect } from "next/navigation";

/** Legacy admin entry — redirect to authenticated gestion area. */
export default function AdminRedirectPage() {
  redirect("/gestion");
}
