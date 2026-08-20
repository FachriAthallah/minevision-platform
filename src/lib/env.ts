import "server-only";

import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .min(1, "DATABASE_URL wajib diisi")
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    {
      message:
        "DATABASE_URL harus menggunakan protokol postgresql:// atau postgres://",
    },
  );

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL harus berupa URL yang valid"),

  DATABASE_URL: databaseUrlSchema,
});

const validationResult = environmentSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
});

if (!validationResult.success) {
  console.error(
    "Environment validation failed:",
    validationResult.error.flatten().fieldErrors,
  );

  throw new Error("Konfigurasi environment MineVision tidak valid.");
}

export const env = Object.freeze(validationResult.data);
