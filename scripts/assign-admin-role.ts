import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_MIGRATION_URL;
const requestedEmail = process.argv[2]?.trim().toLowerCase();

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.");
}

if (!requestedEmail) {
  throw new Error(
    "Gunakan: npm run auth:assign-admin -- administrator@example.com",
  );
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

async function assignAdministratorRole() {
  try {
    const result = await sqlClient.begin(async (transaction) => {
      const identities = await transaction<{ id: string }[]>`
        SELECT id
        FROM auth.users
        WHERE lower(email) = ${requestedEmail}
        LIMIT 1
        FOR UPDATE;
      `;

      if (!identities[0]) {
        throw new Error(
          "Identity belum tersedia. Buat atau undang akun melalui Supabase Auth terlebih dahulu.",
        );
      }

      const administratorRoles = await transaction<{ id: string }[]>`
        SELECT id
        FROM public.roles
        WHERE key = 'administrator'
        LIMIT 1;
      `;

      if (!administratorRoles[0]) {
        throw new Error("Role administrator belum tersedia di database.");
      }

      await transaction`
        INSERT INTO public.user_role_assignments (
          user_id,
          role_id
        )
        VALUES (
          ${identities[0].id}::uuid,
          ${administratorRoles[0].id}::uuid
        )
        ON CONFLICT (user_id, role_id) DO NOTHING;
      `;

      return identities[0].id;
    });

    console.log(`Role administrator berhasil dipastikan untuk identity ${result}.`);
  } finally {
    await sqlClient.end();
  }
}

assignAdministratorRole().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Gagal memberikan role administrator.",
  );
  process.exitCode = 1;
});
