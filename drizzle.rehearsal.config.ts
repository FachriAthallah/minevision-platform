import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const rehearsalUrlSchema = z
  .string()
  .min(1, "DATABASE_MIGRATION_URL_REHEARSAL wajib diisi")
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    {
      message:
        "DATABASE_MIGRATION_URL_REHEARSAL harus menggunakan protokol postgresql:// atau postgres://",
    },
  );

const validationResult = rehearsalUrlSchema.safeParse(
  process.env.DATABASE_MIGRATION_URL_REHEARSAL,
);

if (!validationResult.success) {
  throw new Error("DATABASE_MIGRATION_URL_REHEARSAL tidak valid.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",

  dbCredentials: {
    url: validationResult.data,
  },

  strict: true,
  verbose: true,
});