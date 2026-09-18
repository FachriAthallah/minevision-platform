export const ADMIN_ROUTE_GROUP = "/admin";

export const ADMIN_ROUTES = {
  overview: "/admin",
  traffic: "/admin/traffic",
  audience: "/admin/audience",
  engagement: "/admin/engagement",
  performance: "/admin/performance",
  appearance: "/admin/appearance",
  siteProfile: "/admin/site-profile",
  media: "/admin/media",
  profile: "/admin/profile",
  activityLog: "/admin/activity-log",
} as const;

export const ADMIN_NAVIGATION = [
  { label: "Overview", href: ADMIN_ROUTES.overview },
  { label: "Traffic", href: ADMIN_ROUTES.traffic },
  { label: "Audience", href: ADMIN_ROUTES.audience },
  { label: "Engagement", href: ADMIN_ROUTES.engagement },
  { label: "Performance", href: ADMIN_ROUTES.performance },
  {
    label: "Appearance",
    href: ADMIN_ROUTES.appearance,
    configOnly: true,
  },
  {
    label: "Site Profile",
    href: ADMIN_ROUTES.siteProfile,
    configOnly: true,
  },
  { label: "Media Library", href: ADMIN_ROUTES.media, configOnly: true },
  { label: "My Profile", href: ADMIN_ROUTES.profile },
  { label: "Activity Log", href: ADMIN_ROUTES.activityLog },
] as const;

export const ADMIN_ANALYTICS_ROLES = new Set([
  "owner",
  "administrator",
  "analyst",
]);

export const ADMIN_CONFIG_ROLES = new Set(["owner", "administrator"]);

export const ADMIN_ACTIVE_ROLE_KEYS = ["owner", "administrator", "analyst"] as const;

export type AdminRoleKey = (typeof ADMIN_ACTIVE_ROLE_KEYS)[number];

export function isAdminRoleKey(key: string): key is AdminRoleKey {
  return (ADMIN_ACTIVE_ROLE_KEYS as readonly string[]).includes(key);
}

export function canViewAnalytics(roleKeys: readonly string[]) {
  return roleKeys.some((key) => ADMIN_ANALYTICS_ROLES.has(key));
}

export function canManageConfig(roleKeys: readonly string[]) {
  return roleKeys.some((key) => ADMIN_CONFIG_ROLES.has(key));
}

export function isAdminRoleOwner(roleKeys: readonly string[]) {
  return roleKeys.includes("owner");
}