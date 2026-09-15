import { cookies } from "next/headers";

/** MVP auth — replace with proper identity provider before production. */
export const GESTION_SESSION_COOKIE = "sage_gestion_session";
export const GESTION_DEMO_USER = "admin";
export const GESTION_DEMO_PASSWORD = "sage2026";

export async function isGestionAuthenticated() {
  const jar = await cookies();
  return jar.get(GESTION_SESSION_COOKIE)?.value === "ok";
}

export function gestionLoginOk(username: string, password: string) {
  return username.trim() === GESTION_DEMO_USER && password === GESTION_DEMO_PASSWORD;
}
