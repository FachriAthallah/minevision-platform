import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

const globalForDatabase = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

const postgresClient =
  globalForDatabase.postgresClient ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: 1,
    ssl: "require",
    connect_timeout: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresClient = postgresClient;
}

export const db = drizzle(postgresClient);