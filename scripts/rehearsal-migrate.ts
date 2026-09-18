import { config } from "dotenv";

config({
  path: ".env.local",
});

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_MIGRATION_URL_REHEARSAL ??
  process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_MIGRATION_URL_REHEARSAL atau DATABASE_MIGRATION_URL tidak ditemukan.",
  );
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

async function main() {
  const db = drizzle(sqlClient);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
  await sqlClient.end();
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    const typed = error as Error & {
      code?: string;
      detail?: string;
      hint?: string;
      column?: string;
    };
    console.error("message:", typed.message);
    if (typed.code) console.error("code:", typed.code);
    if (typed.detail) console.error("detail:", typed.detail);
    if (typed.hint) console.error("hint:", typed.hint);
    if (typed.column) console.error("column:", typed.column);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
});