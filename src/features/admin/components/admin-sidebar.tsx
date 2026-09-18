"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  FileImage,
  Gauge,
  Globe2,
  LayoutDashboard,
  LogOut,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { ADMIN_NAVIGATION } from "@/features/admin/lib/permissions";
import { adminSignOut } from "@/features/admin/actions";

const ICONS: Record<string, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  traffic: BarChart3,
  audience: Users,
  engagement: Gauge,
  performance: Activity,
  appearance: Palette,
  siteProfile: Globe2,
  media: FileImage,
  profile: UserRound,
  activityLog: Activity,
};

export function AdminSidebar({
  canManageConfig,
  displayName,
  email,
}: {
  canManageConfig: boolean;
  displayName: string | null;
  email: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = ADMIN_NAVIGATION.filter(
    (item) => canManageConfig || !("configOnly" in item) || !item.configOnly,
  );

  const nav = (
    <nav aria-label="Navigasi Admin" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon =
          ICONS[item.href.split("/")[2] ?? "overview"] ?? LayoutDashboard;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(`${item.href}/`) || pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
              active
                ? "bg-brand-cyan/10 text-white"
                : "text-[#9FACBA] hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon aria-hidden="true" className="size-[18px] shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-3 pb-4 pt-2">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))]">
        <LayoutDashboard aria-hidden="true" className="size-4 text-[#02131a]" />
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">MineVision</p>
          <p className="truncate text-[11px] text-[#718196]">Admin</p>
        </div>
      ) : null}
    </div>
  );

  const account = (
    <div className="border-t border-white/10 p-3">
      {!collapsed ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl px-2 py-1.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/5 text-sm font-bold text-brand-cyan">
            {(displayName ?? email ?? "A").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {displayName ?? "Administrator"}
            </p>
            {email ? (
              <p className="truncate text-[11px] text-[#718196]">{email}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <AdminLogoutButton collapsed={collapsed} />
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Buka navigasi admin"
        aria-expanded={mobileOpen}
        aria-controls="admin-mobile-nav"
        onClick={() => setMobileOpen((open) => !open)}
        className="fixed left-4 top-4 z-50 inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#071426]/90 text-white lg:hidden focus-visible:outline-2 focus-visible:outline-brand-cyan"
      >
        {mobileOpen ? (
          <PanelLeftClose aria-hidden="true" className="size-5" />
        ) : (
          <PanelLeftOpen aria-hidden="true" className="size-5" />
        )}
      </button>

      {mobileOpen ? (
        <div className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#071426] p-3 lg:hidden">
          {brand}
          {nav}
          {account}
        </div>
      ) : null}

      <aside
        aria-label="Sidebar admin"
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/10 bg-[#071426] p-3 transition-[width] lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {brand}
        {nav}
        <div className="mt-auto">
          {account}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#9FACBA] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-cyan"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-[18px]" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-[18px]" />
            )}
            {!collapsed ? <span>Ciutkan</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminLogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={adminSignOut}>
      <button
        type="submit"
        aria-label="Logout dari Admin"
        title="Logout"
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-[#9FACBA] transition-colors hover:border-danger/40 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
          collapsed && "size-10 justify-center p-0",
        )}
      >
        <LogOut aria-hidden="true" className="size-[18px] shrink-0" />
        {!collapsed ? <span>Logout</span> : null}
      </button>
    </form>
  );
}