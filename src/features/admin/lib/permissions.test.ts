import { describe, expect, it } from "vitest";

import {
  canManageConfig,
  canViewAnalytics,
  isAdminRoleKey,
} from "./permissions";

describe("admin permissions", () => {
  it("mengenali seluruh role admin", () => {
    expect(["owner", "administrator", "analyst"].every(isAdminRoleKey)).toBe(true);
    expect(isAdminRoleKey("user")).toBe(false);
  });

  it("owner memiliki akses analytics dan konfigurasi", () => {
    expect(canViewAnalytics(["owner"])).toBe(true);
    expect(canManageConfig(["owner"])).toBe(true);
  });

  it("administrator dapat mengelola konfigurasi", () => {
    expect(canViewAnalytics(["administrator"])).toBe(true);
    expect(canManageConfig(["administrator"])).toBe(true);
  });

  it("analyst hanya read-only analytics", () => {
    expect(canViewAnalytics(["analyst"])).toBe(true);
    expect(canManageConfig(["analyst"])).toBe(false);
  });

  it("role lain tidak memiliki akses admin", () => {
    expect(canViewAnalytics(["user", "content_editor"])).toBe(false);
    expect(canManageConfig(["user"])).toBe(false);
  });
});