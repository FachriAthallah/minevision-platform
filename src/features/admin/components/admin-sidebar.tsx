"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  FileImage,
  Gauge,
  Globe2,
  LayoutDashboard,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { ADMIN_ROUTES } from "@/features/admin/lib/permissions";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  configOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const OVERVIEW_ITEM: NavItem = {
  label: "Overview",
  href: ADMIN_ROUTES.overview,
  icon: LayoutDashboard,
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Analytics",
    items: [
      { label: "Traffic", href: ADMIN_ROUTES.traffic, icon: BarChart3 },
      { label: "Audience", href: ADMIN_ROUTES.audience, icon: Users },
      { label: "Engagement", href: ADMIN_ROUTES.engagement, icon: Gauge },
      { label: "Performance", href: ADMIN_ROUTES.performance, icon: Activity },
    ],
  },
  {
    label: "Website",
    items: [
      { label: "Appearance", href: ADMIN_ROUTES.appearance, icon: Palette, configOnly: true },
      { label: "Site Profile", href: ADMIN_ROUTES.siteProfile, icon: Globe2, configOnly: true },
      { label: "Media Library", href: ADMIN_ROUTES.media, icon: FileImage, configOnly: true },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "My Profile", href: ADMIN_ROUTES.profile, icon: UserRound },
      { label: "Activity Log", href: ADMIN_ROUTES.activityLog, icon: Activity },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function renderNavItem(
  item: NavItem,
  pathname: string,
  collapsed: boolean,
  onNavigate: () => void,
) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);

  return (
    <li key={item.href}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent",
          active
            ? "bg-admin-raised text-admin-text"
            : "text-admin-muted hover:bg-admin-raised/50 hover:text-admin-text",
        )}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-admin-accent"
          />
        ) : null}
        <Icon aria-hidden="true" className="size-[18px] shrink-0" />
        {!collapsed ? <span>{item.label}</span> : null}
      </Link>
    </li>
  );
}

function NavItems({
  canManageConfig,
  collapsed,
  onNavigate,
}: {
  canManageConfig: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canManageConfig || !item.configOnly),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Navigasi Admin" className="flex flex-1 flex-col gap-5 overflow-y-auto">
      <ul className="flex flex-col gap-0.5">
        {renderNavItem(OVERVIEW_ITEM, pathname, collapsed, onNavigate)}
      </ul>
      {visibleGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed ? (
            <p className="px-3 pb-1 text-[11px] font-medium text-admin-muted">
              {group.label}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) =>
              renderNavItem(item, pathname, collapsed, onNavigate),
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center px-2 pb-5 pt-2",
        collapsed ? "flex-col gap-2" : "justify-between gap-2",
      )}
    >
      <div className={cn("flex min-w-0 items-center gap-2", collapsed && "flex-col")}>
        <Image
          src="/images/brand/minevision-mark-white.png"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="size-8 shrink-0 object-contain"
        />
        {!collapsed ? (
          <Image
            src="/images/brand/minevision-wordmark-white.png"
            alt="MineVision"
            width={104}
            height={20}
            className="h-5 w-auto shrink-0 object-contain"
          />
        ) : null}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-admin-muted transition-colors hover:bg-admin-raised hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
      >
        {collapsed ? (
          <PanelLeftOpen aria-hidden="true" className="size-4" />
        ) : (
          <PanelLeftClose aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}

export function AdminSidebar({ canManageConfig }: { canManageConfig: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <NavItems
      canManageConfig={canManageConfig}
      collapsed={collapsed}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <>
      <button
        type="button"
        aria-label="Buka navigasi admin"
        aria-expanded={mobileOpen}
        aria-controls="admin-mobile-nav"
        onClick={() => setMobileOpen((open) => !open)}
        className="fixed left-4 top-4 z-50 inline-flex size-10 items-center justify-center rounded-md border border-admin-line bg-admin-surface/95 text-admin-text backdrop-blur lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
      >
        {mobileOpen ? (
          <PanelLeftClose aria-hidden="true" className="size-5" />
        ) : (
          <PanelLeftOpen aria-hidden="true" className="size-5" />
        )}
      </button>

      {mobileOpen ? (
        <div
          id="admin-mobile-nav"
          className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-admin-line bg-admin-surface p-3 lg:hidden"
        >
          <SidebarBrand collapsed={false} onToggle={() => {}} />
          {nav}
        </div>
      ) : null}

      <aside
        aria-label="Sidebar admin"
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-admin-line bg-admin-surface p-3 transition-[width] lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarBrand collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        {nav}
      </aside>
    </>
  );
}