const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Konfigurasi Supabase Auth belum lengkap.");
}

export const supabaseConfig = Object.freeze({
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
});
