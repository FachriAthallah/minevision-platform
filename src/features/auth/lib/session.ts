import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  roles,
  userProfiles,
  userRoleAssignments,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

import { getSafeInternalPath } from "./validation";

export type AuthenticatedIdentity = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  roles: string[];
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
    db
      .select({ key: roles.key })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(eq(userRoleAssignments.userId, userId)),
  ]);

  const claimsEmail = data.claims.email;

  return {
    id: userId,
    email: typeof claimsEmail === "string" ? claimsEmail : null,
    username: profile[0]?.username ?? null,
    displayName: profile[0]?.displayName ?? null,
    avatarUrl: profile[0]?.avatarUrl ?? null,
    roles: assignedRoles.map((role) => role.key),
  };
}

export function isAdministrator(identity: AuthenticatedIdentity) {
  return identity.roles.includes("administrator");
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
