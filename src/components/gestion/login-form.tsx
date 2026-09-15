"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GestionLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("sage2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/gestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      if (!res.ok) {
        setError("Identifiants invalides");
        setLoading(false);
        return;
      }
      router.push("/gestion");
      router.refresh();
    } catch {
      setError("Connexion impossible — réessayez");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-md border border-white/10 bg-white/5 p-6">
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
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void login();
          }}
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void login();
          }}
          className="border-white/15 bg-[#0b2a18] text-sand"
          required
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button
        type="button"
        className="w-full bg-copper text-accent-foreground"
        disabled={loading || !username.trim() || !password}
        onClick={() => void login()}
      >
        {loading ? "Connexion…" : "Entrer"}
      </Button>
      <p className="text-xs text-sand/45">Démo : admin / sage2026</p>
    </div>
  );
}
