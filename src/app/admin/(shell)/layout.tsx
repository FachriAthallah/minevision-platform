import type { ReactNode } from "react";
import { headers } from "next/headers";

import { requireAdminAccess } from "@/features/admin/lib/authorization";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
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
      <div className="flex min-h-screen bg-[#020817] text-white">
        <AdminSidebar
          canManageConfig={access.canManageConfig}
          displayName={access.identity.displayName}
          email={access.identity.email}
        />
        <main className="min-w-0 flex-1 pl-16 px-6 pt-20 lg:pl-8">
          <AdminForbidden message="Role Anda saat ini hanya dapat melihat analytics. Mengubah konfigurasi membutuhkan role owner atau administrator." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020817] text-white lg:gap-0">
      <AdminSidebar
        canManageConfig={access.canManageConfig}
        displayName={access.identity.displayName}
        email={access.identity.email}
      />
      <div className="min-w-0 flex-1 pl-16 lg:pl-0">
        <div className="px-4 pt-16 sm:px-6 lg:px-8 lg:pt-6">{children}</div>
      </div>
    </div>
  );
}