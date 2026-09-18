import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan.");
}

const requestedEmail = process.argv[2]?.trim().toLowerCase();

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

async function main() {
  const statusColumn = await sqlClient<{ count: string }[]>`
    SELECT count(*)::text AS count
    FROM information_schema.columns
    WHERE table_name = 'user_role_assignments' AND column_name = 'status';
  `;
  console.log(`1. Kolom user_role_assignments.status terpasang: ${statusColumn[0]?.count === "1" ? "YA" : "TIDAK"}`);

  const settingsTable = await sqlClient<{ count: string }[]>`
    SELECT count(*)::text AS count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'site_settings';
  `;
  console.log(`2. Tabel site_settings tersedia: ${settingsTable[0]?.count === "1" ? "YA" : "TIDAK"}`);

  const roles = await sqlClient<{ key: string }[]>`
    SELECT key FROM public.roles WHERE key IN ('owner', 'administrator', 'analyst') ORDER BY key;
  `;
  console.log(`3. Role admin di database: [${roles.map((row) => row.key).join(", ") || "KOSONG"}]`);

  const migrationRows = await sqlClient<{ migrations: string }[]>`
    SELECT count(*)::text AS migrations FROM drizzle.__drizzle_migrations;
  `;
  console.log(`4. Jumlah migration tercatat: ${migrationRows[0]?.migrations ?? "??"} (target 23)`);

  if (requestedEmail) {
    const match = await sqlClient<{ id: string }[]>`
      SELECT id FROM auth.users WHERE lower(email) = ${requestedEmail} LIMIT 1;
    `;

    if (!match[0]) {
      console.log("5. Akun dengan email tersebut TIDAK ditemukan di auth.users.");
    } else {
      const assignments = await sqlClient<{ key: string; status: string | null }[]>`
        SELECT r.key, ur.status
        FROM public.user_role_assignments ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = ${match[0].id};
      `;
      console.log(`5. Akun ditemukan. Role assignment: [${assignments.map((row) => `${row.key}(${row.status ?? "unknown"})`).join(", ") || "KOSONG"}]`);
    }
  } else {
    console.log("5. (Berikan email untuk memeriksa role akun.)");
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await sqlClient.end();
    } catch {
      // closed
    }
  });