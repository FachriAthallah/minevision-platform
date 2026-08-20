import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";

config({
  path: ".env.local",
});

const migrationUrlSchema = z
  .string()
  .min(1, "DATABASE_MIGRATION_URL wajib diisi")
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    {
      message:
        "DATABASE_MIGRATION_URL harus menggunakan protokol postgresql:// atau postgres://",
    },
  );

const validationResult = migrationUrlSchema.safeParse(
  process.env.DATABASE_MIGRATION_URL,
);

if (!validationResult.success) {
  console.error(
    "Drizzle environment validation failed:",
    validationResult.error.flatten(),
  );

  throw new Error("DATABASE_MIGRATION_URL tidak valid.");
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
