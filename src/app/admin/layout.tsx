import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  getAuthenticatedIdentity,
  isAdministrator,
} from "@/features/auth/lib/session";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    redirect("/login?next=/admin");
  }

  if (!isAdministrator(identity)) {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">{children}</div>
  );
}
