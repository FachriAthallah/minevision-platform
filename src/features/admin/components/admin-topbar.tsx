"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { StatusBadge } from "@/features/admin/components/admin-ui";
import { adminSignOut } from "@/features/admin/actions";

const SECTION_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: "/admin/traffic", label: "Traffic Analytics" },
  { prefix: "/admin/audience", label: "Audience Analytics" },
  { prefix: "/admin/engagement", label: "Engagement Analytics" },
  { prefix: "/admin/performance", label: "Performance Analytics" },
  { prefix: "/admin/appearance", label: "Appearance" },
  { prefix: "/admin/site-profile", label: "Site Profile" },
  { prefix: "/admin/media", label: "Media Library" },
  { prefix: "/admin/profile", label: "My Profile" },
  { prefix: "/admin/activity-log", label: "Activity Log" },
];

function resolveSectionLabel(pathname: string): string {
  const match = SECTION_LABELS.find(
    (section) =>
      pathname === section.prefix || pathname.startsWith(`${section.prefix}/`),
  );
  return match?.label ?? "Dashboard Overview";
}

export function AdminTopbar({
  displayName,
  email,
}: {
  displayName: string | null;
  email: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-admin-line bg-admin-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <p className="truncate text-sm font-semibold text-admin-text">
        {resolveSectionLabel(pathname)}
      </p>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 items-center gap-2.5 rounded-md border border-admin-line bg-admin-raised/40 py-1.5 pl-1.5 pr-3">
          <div
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-md bg-admin-raised text-xs font-bold text-admin-accent"
          >
            {(displayName ?? email ?? "A").slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-semibold leading-4 text-admin-text">
              {displayName ?? "Administrator"}
            </p>
            <p className="truncate text-[11px] leading-4 text-admin-muted">{email}</p>
          </div>
          <StatusBadge tone="neutral" className="hidden md:inline-flex">
            Admin
          </StatusBadge>
        </div>
        <form action={adminSignOut}>
          <button
            type="submit"
            aria-label="Logout dari Admin"
            title="Logout"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-admin-line px-2.5 text-sm font-semibold text-admin-muted transition-colors hover:border-admin-bad/40 hover:text-admin-bad focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
          >
            <LogOut aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}