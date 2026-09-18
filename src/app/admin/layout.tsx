import type { ReactNode } from "react";
import { headers } from "next/headers";

import { requireAdminAccess } from "@/features/admin/lib/authorization";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    );
  }

  await requireAdminAccess();

  return (
    <div className="min-h-screen bg-background text-foreground">{children}</div>
  );
}