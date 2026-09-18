import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  roleAssignmentStatusEnum,
  roles,
  userProfiles,
  userRoleAssignments,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

import { getSafeInternalPath } from "./validation";

export type RoleAssignmentSummary = {
  key: string;
  status: (typeof roleAssignmentStatusEnum.enumValues)[number];
};

export type AuthenticatedIdentity = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  roles: string[];
  roleAssignments: RoleAssignmentSummary[];
};

export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const userId = String(data.claims.sub);
  const [profile, assignedRoles] = await Promise.all([
    db
      .select({
        username: userProfiles.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1),
    loadRoleAssignments(userId),
  ]);

  const claimsEmail = data.claims.email;

  return {
    id: userId,
    email: typeof claimsEmail === "string" ? claimsEmail : null,
    username: profile[0]?.username ?? null,
    displayName: profile[0]?.displayName ?? null,
    avatarUrl: profile[0]?.avatarUrl ?? null,
    roles: assignedRoles.map((role) => role.key),
    roleAssignments: assignedRoles.map((role) => ({
      key: role.key,
      status: role.status,
    })),
  };
}

async function loadRoleAssignments(userId: string): Promise<RoleAssignmentSummary[]> {
  try {
    return await db
      .select({ key: roles.key, status: userRoleAssignments.status })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(eq(userRoleAssignments.userId, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const columnMissing = /column .*status.* does not exist/i.test(message);

    if (!columnMissing) {
      throw error;
    }

    // Migration 0022 belum diterapkan. Anggap assignment active sementara
    // agar login yang sudah ada tetap berfungsi.
    const legacy = await db
      .select({ key: roles.key })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(eq(userRoleAssignments.userId, userId));

    return legacy.map((row) => ({ key: row.key, status: "active" }));
  }
}

export function isAdministrator(identity: AuthenticatedIdentity) {
  return identity.roles.some((role) =>
    ["owner", "administrator", "analyst"].includes(role),
  );
}

export function getPostLoginPath(
  identity: AuthenticatedIdentity,
  requestedPath?: string | null,
) {
  if (isAdministrator(identity)) {
    return "/admin";
  }

  const safePath = getSafeInternalPath(requestedPath);

  if (safePath && !safePath.startsWith("/admin")) {
    return safePath;
  }

  return "/account";
}
