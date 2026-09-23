"use client";

import { useEffect } from "react";

import { isAdminPath } from "@/features/admin/lib/analytics-paths";
import { getClientContext } from "@/features/admin/lib/client-context";

const SESSION_STORAGE_KEY = "minevision_anonymous_session";

function generateAnonymousSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `s_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  }
  return `s_${Math.random().toString(36).slice(2, 14)}${Date.now().toString(36)}`;
}

function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8) {
      return existing;
    }
  } catch {
    // localStorage tidak tersedia; tetap buat session ephemeral.
  }

  const sessionId = generateAnonymousSessionId();

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // abaikan; session tetap berlaku untuk halaman ini.
  }

  return sessionId;
}

function getNormalizedPath(): string {
  const raw = window.location.pathname + window.location.hash;
  const withoutQuery = raw.split(/[?#]/, 1)[0] ?? "/";
  return withoutQuery.length > 500 ? withoutQuery.slice(0, 500) : withoutQuery;
}

function sendEvent(payload: {
  event_type: string;
  path: string;
  module?: string;
  referrer_domain?: string;
  properties?: Record<string, unknown>;
}) {
  if (!navigator.sendBeacon) {
    return;
  }

  const sessionId = getOrCreateSessionId();
  const ctx = getClientContext();

  const blob = new Blob(
    [
      JSON.stringify({
        ...payload,
        session_id: sessionId,
        device_category: ctx.deviceCategory,
        browser_family: ctx.browserFamily,
        os_family: ctx.osFamily,
      }),
    ],
    { type: "application/json" },
  );

  navigator.sendBeacon("/api/v1/analytics/events", blob);
}

function isReducedMotionPreferred(): boolean {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function AnalyticsTracker({
  module,
  contentModule,
}: {
  module?: string;
  contentModule?: string;
}) {
  useEffect(() => {
    if (isAdminPath(window.location.pathname)) {
      return;
    }

    let moduleName = module ?? contentModule ?? "";
    let referrerDomain = "";

    try {
      const parsedReferrer = new URL(document.referrer);
      referrerDomain = parsedReferrer.hostname.replace(/^www\./, "");
      const match = window.location.pathname.match(/^\/([a-z-]+)/);
      if (match?.[1]) {
        moduleName = moduleName || match[1];
      }
    } catch {
      // referrer tidak valid diabaikan.
    }

    sendEvent({
      event_type: "page_view",
      path: getNormalizedPath(),
      module: moduleName || undefined,
      referrer_domain: referrerDomain || undefined,
    });

    return () => {
      if (isReducedMotionPreferred()) {
        return;
      }
    };
  }, [module, contentModule]);

  return null;
}