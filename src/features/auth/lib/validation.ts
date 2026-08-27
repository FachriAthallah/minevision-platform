import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Masukkan alamat email yang valid.")
  .max(254, "Alamat email terlalu panjang.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.")
  .regex(/[A-Za-z]/, "Password harus memiliki setidaknya satu huruf.")
  .regex(/[0-9]/, "Password harus memiliki setidaknya satu angka.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi."),
  next: z.string().optional(),
});

export const createAccountSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter.")
      .max(50, "Username maksimal 50 karakter.")
      .regex(
        /^[A-Za-z0-9_]+$/,
        "Username hanya boleh berisi huruf, angka, dan underscore.",
      )
      .transform((value) => value.toLowerCase()),
    email: emailSchema,
    password: passwordSchema,
    repeatPassword: z.string(),
  })
  .refine((value) => value.password === value.repeatPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["repeatPassword"],
  });

export function getSafeInternalPath(
  value: FormDataEntryValue | string | null | undefined,
) {
  if (typeof value !== "string") {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://minevision.local");

    if (parsed.origin !== "https://minevision.local") {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
