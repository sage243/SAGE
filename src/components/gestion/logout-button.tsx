"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="border-white/20 bg-transparent text-sand hover:bg-white/10"
      onClick={async () => {
        await fetch("/api/auth/gestion", { method: "DELETE" });
        router.push("/gestion/login");
        router.refresh();
      }}
    >
      Déconnexion
    </Button>
  );
}
