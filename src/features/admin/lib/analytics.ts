import "server-only";

import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

import type { adminAnalyticsEventSchema, adminWebVitalSchema } from "../schemas/admin-validation";
import type { z } from "zod";

import { isAdminPath } from "./analytics-paths";

export type IngestableEvent = z.infer<typeof adminAnalyticsEventSchema>;

function normalizePath(rawPath: string): string | null {
  if (rawPath.length === 0 || rawPath.length > 500) {
    return null;
  }

  const withoutQuery = rawPath.split(/[?#]/, 1)[0] ?? "";

  if (!withoutQuery.startsWith("/")) {
    return null;
  }

  if (withoutQuery.includes("..")) {
    return null;
  }

  return withoutQuery.slice(0, 500);
}

export async function ingestEvent(event: IngestableEvent): Promise<{ ok: true } | { ok: false; code: string }> {
  const path = normalizePath(event.path);

  if (!path) {
    return { ok: false, code: "INVALID_PATH" };
  }

  if (isAdminPath(path)) {
    return { ok: false, code: "ADMIN_PATH_NOT_TRACKED" };
  }

  if (event.session_id.length < 8 || event.session_id.length > 64) {
    return { ok: false, code: "INVALID_SESSION" };
  }

  await db.insert(analyticsEvents).values({
    eventType: event.event_type,
    sessionId: event.session_id,
    path,
    module: event.module,
    referrerDomain: event.referrer_domain,
    deviceCategory: event.device_category,
    browserFamily: event.browser_family,
    osFamily: event.os_family,
    countryCode: event.country_code,
    eventProperties: event.properties,
  });

  return { ok: true };
}

export async function ingestWebVital(
  input: z.infer<typeof adminWebVitalSchema>,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const path = normalizePath(input.path);

  if (!path) {
    return { ok: false, code: "INVALID_PATH" };
  }

  if (isAdminPath(path)) {
    return { ok: false, code: "ADMIN_PATH_NOT_TRACKED" };
  }

  await db.insert(analyticsEvents).values({
    eventType: "web_vital",
    sessionId: "vitals",
    path,
    deviceCategory: input.device_category,
    browserFamily: input.browser_family,
    osFamily: input.os_family,
    countryCode: input.country_code,
    eventProperties: {
      metric: input.metric,
      value: input.value,
    },
  });

  return { ok: true };
}