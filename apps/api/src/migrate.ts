import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { z } from "zod";

const databaseUrl = z.string().url().parse(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: databaseUrl });

try {
  const migration = await readFile(new URL("./migrations/001_initial.sql", import.meta.url), "utf8");
  await pool.query(migration);
  console.info("Database migration completed");
} finally {
  await pool.end();
}
