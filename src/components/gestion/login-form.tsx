"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GestionLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/gestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(form.get("username") || ""),
        password: String(form.get("password") || ""),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Identifiants invalides");
      return;
    }
    router.push("/gestion");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-white/10 bg-white/5 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Connexion gestion</h1>
        <p className="mt-2 text-sm text-sand/65">
          Accès réservé à l’équipe SAGE. MVP local — à remplacer avant production.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sand/80">
          Utilisateur
        </Label>
        <Input
          id="username"
          name="username"
          defaultValue="admin"
          className="border-white/15 bg-[#0b2a18] text-sand"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sand/80">
          Mot de passe
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          className="border-white/15 bg-[#0b2a18] text-sand"
          required
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button type="submit" className="w-full bg-copper text-accent-foreground" disabled={loading}>
        {loading ? "Connexion…" : "Entrer"}
      </Button>
      <p className="text-xs text-sand/45">Démo : admin / sage2026</p>
    </form>
  );
}
