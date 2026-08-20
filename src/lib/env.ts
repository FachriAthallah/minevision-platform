import "server-only";

import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL harus berupa URL yang valid"),
});

const validationResult = environmentSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!validationResult.success) {
  console.error(
    "Environment validation failed:",
    validationResult.error.flatten().fieldErrors,
  );

  throw new Error("Konfigurasi environment MineVision tidak valid.");
}

export const env = Object.freeze(validationResult.data);
