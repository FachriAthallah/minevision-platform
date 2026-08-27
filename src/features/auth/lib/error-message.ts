import type { AuthError } from "@supabase/supabase-js";

export function getPasswordLoginErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "email_not_confirmed":
      return "Email belum dikonfirmasi. Buka email konfirmasi dari MineVision, lalu coba login kembali.";
    case "invalid_credentials":
      return "Email atau password tidak valid.";
    case "over_request_rate_limit":
      return "Terlalu banyak percobaan login. Tunggu beberapa saat, lalu coba kembali.";
    default:
      return "Login belum dapat diproses. Silakan coba kembali beberapa saat lagi.";
  }
}
