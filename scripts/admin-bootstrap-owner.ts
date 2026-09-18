import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_MIGRATION_URL;
const emailArgument = process.argv[2]?.trim().toLowerCase();
const hasCommitFlag = process.argv.includes("--commit");

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.");
}

if (!emailArgument) {
  throw new Error(
    "Gunakan: npm run auth:bootstrap-owner -- administrator@example.com [--commit]",
  );
}

if (!hasCommitFlag) {
  console.log("Mode DRY-RUN aktif. Tidak ada perubahan yang ditulis.");
  console.log("Tambahkan flag --commit untuk benar-benar memberikan role owner.");
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

async function main() {
  const result = await sqlClient.begin(async (transaction) => {
    const identities = await transaction<{ id: string }[]>`
      SELECT id
      FROM auth.users
      WHERE lower(email) = ${emailArgument}
      LIMIT 1
      FOR UPDATE;
    `;

    if (!identities[0]) {
      throw new Error(
        "Identity belum tersedia. Buat atau undang akun melalui Supabase Auth terlebih dahulu.",
      );
    }

    const userId = identities[0].id;

    const ownerRoles = await transaction<{ id: string }[]>`
      SELECT id
      FROM public.roles
      WHERE key = 'owner'
      LIMIT 1;
    `;

    if (!ownerRoles[0]) {
      throw new Error(
        "Role owner belum ada. Jalankan migration 0022 terlebih dahulu.",
      );
    }

    const existingAssignment = await transaction<{ id: string }[]>`
      SELECT ur.user_id
      FROM public.user_role_assignments ur
      WHERE ur.user_id = ${userId}
        AND ur.role_id = ${ownerRoles[0].id}
      LIMIT 1;
    `;

    if (existingAssignment[0]) {
      return { changed: false, userId };
    }

    if (!hasCommitFlag) {
      return {
        changed: true,
        userId,
        dryRun: true,
        plannedSql: `INSERT INTO public.user_role_assignments (user_id, role_id, status) VALUES (${userId}, ${ownerRoles[0].id}, 'active')`,
      };
    }

    await transaction`
      INSERT INTO public.user_role_assignments (user_id, role_id, status)
      VALUES (
        ${userId},
        ${ownerRoles[0].id},
        'active'
      )
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `;

    return { changed: true, userId };
  });

  if ("dryRun" in result && result.dryRun) {
    console.log("");
    console.log(`[DRY-RUN] Role owner siap diberikan kepada identity ${result.userId}.`);
    console.log("[DRY-RUN] Tidak ada baris yang ditulis.");
    return;
  }

  console.log(
    result.changed
      ? `Role owner berhasil diberikan kepada identity ${result.userId}.`
      : `Identity ${result.userId} sudah memiliki role owner. Tidak ada perubahan.`,
  );
}

main()
  .then(() => sqlClient.end())
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Gagal bootstrap owner.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await sqlClient.end();
    } catch {
      // koneksi sudah ditutup.
    }
  });