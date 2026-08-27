import { describe, expect, it } from "vitest";

import {
  createAccountSchema,
  getSafeInternalPath,
  loginSchema,
} from "./validation";

describe("loginSchema", () => {
  it("menormalkan email yang valid", () => {
    expect(
      loginSchema.parse({
        email: " USER@Example.COM ",
        password: "password",
      }).email,
    ).toBe("user@example.com");
  });

  it("menolak password kosong", () => {
    expect(() =>
      loginSchema.parse({ email: "user@example.com", password: "" }),
    ).toThrow();
  });
});

describe("createAccountSchema", () => {
  const validAccount = {
    username: "Mine_User",
    email: "user@example.com",
    password: "minevision123",
    repeatPassword: "minevision123",
  };

  it("menormalkan username dan menerima akun yang valid", () => {
    expect(createAccountSchema.parse(validAccount).username).toBe("mine_user");
  });

  it("menolak username dengan karakter yang tidak didukung", () => {
    expect(() =>
      createAccountSchema.parse({ ...validAccount, username: "mine user" }),
    ).toThrow();
  });

  it("menolak konfirmasi password yang berbeda", () => {
    expect(() =>
      createAccountSchema.parse({
        ...validAccount,
        repeatPassword: "different123",
      }),
    ).toThrow();
  });
});

describe("getSafeInternalPath", () => {
  it("menerima path internal beserta query", () => {
    expect(getSafeInternalPath("/account?tab=profile")).toBe(
      "/account?tab=profile",
    );
  });

  it("menolak URL eksternal dan protocol-relative URL", () => {
    expect(getSafeInternalPath("https://example.com")).toBeNull();
    expect(getSafeInternalPath("//example.com/admin")).toBeNull();
  });
});
