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

/** Render Postgres requires TLS; accept managed certs. */
export function getPool(): Pool {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL manquant — configurez le secret Render PostgreSQL.");
  }
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
  error?: string;
}> {
  if (!isDatabaseConfigured()) {
    return { ok: false, latencyMs: 0, error: "DATABASE_URL non configuré" };
  }
  const started = Date.now();
  try {
    const res = await dbQuery<{ v: string }>("select version() as v");
    return {
      ok: true,
      latencyMs: Date.now() - started,
      version: res.rows[0]?.v,
    };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
