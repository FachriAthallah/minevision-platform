import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";

let storageAdminClient: SupabaseClient | undefined;

export function getStorageAdminClient(): SupabaseClient {
  if (storageAdminClient) {
    return storageAdminClient;
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY wajib diisi untuk akses Storage privat.");
  }

  if (!secretKey.startsWith("sb_secret_") && !secretKey.startsWith("eyJ")) {
    throw new Error("SUPABASE_SECRET_KEY memiliki format yang tidak valid.");
  }

  storageAdminClient = createClient(supabaseConfig.url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return storageAdminClient;
}
