import { redirect } from "next/navigation";
import { isGestionAuthenticated } from "@/lib/auth";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function GestionLoginPage({ searchParams }: Props) {
  if (await isGestionAuthenticated()) {
    redirect("/gestion");
  }
  const params = await searchParams;
  const error = params.error === "1";

  return (
    <div className="space-y-4 rounded-md border border-white/10 bg-white/5 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Connexion gestion</h1>
        <p className="mt-2 text-sm text-sand/65">
          Accès réservé à l’équipe SAGE. MVP local — à remplacer avant production.
        </p>
      </div>

      <form method="POST" action="/api/auth/gestion/login" className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-sand/80">
            Utilisateur
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            defaultValue="admin"
            required
            className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand outline-none focus:border-copper"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-sand/80">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue="sage2026"
            required
            className="h-9 w-full rounded-md border border-white/15 bg-[#0b2a18] px-3 text-sm text-sand outline-none focus:border-copper"
          />
        </div>
        {error && <p className="text-sm text-red-300">Identifiants invalides</p>}
        <button
          type="submit"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-copper px-3 text-sm font-medium text-accent-foreground hover:bg-copper/90"
        >
          Entrer
        </button>
      </form>
      <p className="text-xs text-sand/45">Démo : admin / sage2026</p>
    </div>
  );
}
