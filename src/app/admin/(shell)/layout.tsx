import type { ReactNode } from "react";
import { headers } from "next/headers";

import { requireAdminAccess } from "@/features/admin/lib/authorization";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import { AdminForbidden } from "@/features/admin/components/admin-ui";

const CONFIG_ONLY_PREFIXES = ["/admin/appearance", "/admin/site-profile", "/admin/media"];

type AdminShellLayoutProps = {
  children: ReactNode;
};

export default async function AdminShellLayout({
  children,
}: AdminShellLayoutProps) {
  const access = await requireAdminAccess();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  const needsConfig = CONFIG_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (needsConfig && !access.canManageConfig) {
    return (
      <div className="admin-shell flex min-h-screen bg-admin-ink text-admin-text">
        <AdminSidebar canManageConfig={access.canManageConfig} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-16 lg:pl-0">
          <AdminTopbar
            displayName={access.identity.displayName}
            email={access.identity.email}
          />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <AdminForbidden message="Role Anda saat ini hanya dapat melihat analytics. Mengubah konfigurasi membutuhkan role owner atau administrator." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell flex min-h-screen bg-admin-ink text-admin-text lg:gap-0">
      <AdminSidebar canManageConfig={access.canManageConfig} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-16 lg:pl-0">
        <AdminTopbar
          displayName={access.identity.displayName}
          email={access.identity.email}
        />
        <main className="min-w-0 flex-1">
          <div className="admin-page mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}