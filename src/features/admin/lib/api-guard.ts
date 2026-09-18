import "server-only";

import { getAdminAccessOrNull, type AdminAccess } from "./authorization";

export function adminJsonError(
  code: string,
  message: string,
  status: number,
) {
  return Response.json(
    { success: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export type AdminAccessResult =
  | { ok: true; access: AdminAccess }
  | { ok: false; response: Response };

export async function requireAdminApi(): Promise<AdminAccessResult> {
  const access = await getAdminAccessOrNull();

  if (!access) {
    return {
      ok: false,
      response: adminJsonError(
        "ADMIN_FORBIDDEN",
        "Akses admin tidak diizinkan.",
        403,
      ),
    };
  }

  return { ok: true, access };
}