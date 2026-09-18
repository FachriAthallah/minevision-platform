import "server-only";

import { getAuthenticatedIdentity, type AuthenticatedIdentity } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";

import {
  canManageConfig,
  canViewAnalytics,
  isAdminRoleKey,
} from "./permissions";
import { recordAdminActivity } from "./activity-log";

export type AdminAccessLevel = "analyst" | "config" | "owner";

export type AdminAccess = {
  identity: AuthenticatedIdentity;
  roleKeys: string[];
  level: AdminAccessLevel;
  canViewAnalytics: boolean;
  canManageConfig: boolean;
  canViewActivityLog: boolean;
};

function getActiveAdminRoleKeys(identity: AuthenticatedIdentity): string[] {
  return identity.roleAssignments
    .filter((assignment) => assignment.status === "active")
    .map((assignment) => assignment.key)
    .filter((key) => isAdminRoleKey(key));
}

export function resolveAdminAccess(identity: AuthenticatedIdentity): AdminAccess | null {
  const roleKeys = getActiveAdminRoleKeys(identity);

  if (roleKeys.length === 0) {
    return null;
  }

  const level: AdminAccessLevel = roleKeys.includes("owner")
    ? "owner"
    : roleKeys.includes("administrator")
      ? "config"
      : "analyst";

  return {
    identity,
    roleKeys,
    level,
    canViewAnalytics:
      level === "owner" || level === "config" || canViewAnalytics(roleKeys),
    canManageConfig: level === "owner" || level === "config" || canManageConfig(roleKeys),
    canViewActivityLog: level === "owner" || level === "config" || canViewAnalytics(roleKeys),
  };
}

export async function requireAdminAccess(): Promise<AdminAccess> {
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    redirect("/login?next=/admin");
  }

  const access = resolveAdminAccess(identity);

  if (!access) {
    await recordAdminActivity({
      actor: {
        userId: identity.id,
        email: identity.email,
        displayName: identity.displayName,
      },
      action: "admin_access_denied",
      resourceType: "admin",
      resourceId: undefined,
      afterSummary: { reason: "not_active_admin_role" },
      result: "failure",
    });

    redirect("/account");
  }

  return access;
}

export async function getAdminAccessOrNull(): Promise<AdminAccess | null> {
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    return null;
  }

  return resolveAdminAccess(identity);
}

export function requireConfigAccess(
  access: AdminAccess,
): asserts access is AdminAccess & { canManageConfig: true } {
  if (!access.canManageConfig) {
    throw new AdminForbiddenError();
  }
}

export class AdminForbiddenError extends Error {
  constructor() {
    super("Akses admin tidak diizinkan oleh role aktif.");
    this.name = "AdminForbiddenError";
  }
}