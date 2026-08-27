import { AuthApiError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { getPasswordLoginErrorMessage } from "./error-message";

describe("getPasswordLoginErrorMessage", () => {
  it("memberi petunjuk konfirmasi ketika email belum dikonfirmasi", () => {
    const error = new AuthApiError(
      "Email not confirmed",
      400,
      "email_not_confirmed",
    );

    expect(getPasswordLoginErrorMessage(error)).toContain(
      "Email belum dikonfirmasi",
    );
  });

  it("tidak membocorkan detail untuk kredensial yang salah", () => {
    const error = new AuthApiError(
      "Invalid login credentials",
      400,
      "invalid_credentials",
    );

    expect(getPasswordLoginErrorMessage(error)).toBe(
      "Email atau password tidak valid.",
    );
  });

  it("menggunakan pesan aman untuk error yang tidak dikenal", () => {
    const error = new AuthApiError("Unexpected", 500, "unexpected_failure");

    expect(getPasswordLoginErrorMessage(error)).toBe(
      "Login belum dapat diproses. Silakan coba kembali beberapa saat lagi.",
    );
  });
});
