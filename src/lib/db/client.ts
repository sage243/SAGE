import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __sagePgPool: Pool | undefined;
}

export function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

/** Sanitize URL for logs — never print password. */
export function describeDatabaseUrl(raw?: string): string {
  const url = raw || getDatabaseUrl();
  if (!url) return "(missing)";
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username ? "***@" : ""}${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(invalid DATABASE_URL — check format postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require)";
  }
}

function assertDatabaseUrl(connectionString: string) {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(
      "DATABASE_URL invalide. Format attendu: postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require",
    );
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(`DATABASE_URL: protocole invalide (${parsed.protocol})`);
  }
  if (!parsed.hostname || parsed.hostname === "base" || parsed.hostname.length < 3) {
    throw new Error(
      `DATABASE_URL: hôte invalide "${parsed.hostname}". Sur Render, copiez External ou Internal Database URL complète (pas seulement le nom de la base). Actuel: ${describeDatabaseUrl(connectionString)}`,
    );
  }
}

/** Render Postgres requires TLS; accept managed certs. */
export function getPool(): Pool {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL manquant — configurez le secret Render PostgreSQL.");
  }
  assertDatabaseUrl(connectionString);
  if (!globalThis.__sagePgPool) {
    globalThis.__sagePgPool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
      max: 8,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
    });
  }
  return globalThis.__sagePgPool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}

export async function dbHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  version?: string;
  target?: string;
  error?: string;
}> {
  if (!isDatabaseConfigured()) {
    return { ok: false, latencyMs: 0, error: "DATABASE_URL non configuré" };
  }
  const started = Date.now();
  try {
    assertDatabaseUrl(getDatabaseUrl()!);
    const res = await dbQuery<{ v: string }>("select version() as v");
    return {
      ok: true,
      latencyMs: Date.now() - started,
      version: res.rows[0]?.v,
      target: describeDatabaseUrl(),
    };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      target: describeDatabaseUrl(),
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
