#!/usr/bin/env node
/**
 * Apply SQL migrations against DATABASE_URL (Render Postgres).
 * Usage: node --env-file=.env.local scripts/db-migrate.mjs
 *    or: DATABASE_URL=... node scripts/db-migrate.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sqlDir = path.join(__dirname, "sql");

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
});

async function main() {
  const files = fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (!files.length) {
    console.error("Aucun fichier SQL dans scripts/sql");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const ver = await client.query("select version()");
    console.log("Connecté:", ver.rows[0].version.split(",")[0]);
    for (const file of files) {
      const sql = fs.readFileSync(path.join(sqlDir, file), "utf8");
      console.log("→", file);
      await client.query(sql);
    }
    console.log("Migrations OK");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
