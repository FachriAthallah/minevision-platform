export const ADMIN_PATH_PREFIX = "/admin";

export function isAdminPath(path: string) {
  return path === ADMIN_PATH_PREFIX || path.startsWith(`${ADMIN_PATH_PREFIX}/`);
}