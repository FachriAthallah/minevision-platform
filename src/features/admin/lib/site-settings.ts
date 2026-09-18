import "server-only";

import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import {
  siteSettingVersions,
  siteSettings,
  type SiteSetting,
} from "@/db/schema";

import {
  appearanceSchema,
  siteProfileSchema,
  type AppearanceSettings,
  type SiteProfileSettings,
} from "../schemas/admin-validation";
import { recordAdminActivity, type AdminActor } from "./activity-log";

export const SITE_SETTING_KEYS = {
  appearance: "appearance",
  siteProfile: "site_profile",
} as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS];

export const SITE_SETTINGS_CACHE_TAG = "site-settings";

export const defaultAppearance: AppearanceSettings = {
  logo: "",
  logoCompact: "",
  favicon: "",
  heroImage: "",
  heroAltText: "",
  heroFocalPoint: { x: 50, y: 50 },
  overlayOpacity: 0.5,
};

export const defaultSiteProfile: SiteProfileSettings = {
  name: "MineVision",
  tagline: "Intelligence Platform Indonesia",
  description: "",
  footerDescription: "",
  contactEmail: "",
  contactPhone: "",
  organizationAddress: "",
  seoTitle: "",
  seoDescription: "",
  footerCopyright: "",
  socialLinks: [],
  officialSources: [],
};

export type PublishedSettingsMap = {
  appearance?: AppearanceSettings;
  siteProfile?: SiteProfileSettings;
};

async function readSettingOrDefault(
  key: SiteSettingKey,
): Promise<SiteSetting | "missing"> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  if (!rows[0]) {
    return "missing";
  }
  return rows[0];
}

function parsePublishedAppearance(raw: unknown): AppearanceSettings | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const parsed = appearanceSchema.safeParse(raw);
  if (!parsed.success) {
    return undefined;
  }
  return parsed.data;
}

function parsePublishedSiteProfile(raw: unknown): SiteProfileSettings | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const parsed = siteProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return undefined;
  }
  return parsed.data;
}

const cachedPublishedAppearance = unstable_cache(
  async (): Promise<AppearanceSettings> => {
    const setting = await readSettingOrDefault(SITE_SETTING_KEYS.appearance);
    if (setting === "missing") {
      return defaultAppearance;
    }
    return parsePublishedAppearance(setting.published) ?? defaultAppearance;
  },
  ["published-appearance"],
  {
    tags: [SITE_SETTINGS_CACHE_TAG],
    revalidate: 60,
  },
);

const cachedPublishedSiteProfile = unstable_cache(
  async (): Promise<SiteProfileSettings> => {
    const setting = await readSettingOrDefault(SITE_SETTING_KEYS.siteProfile);
    if (setting === "missing") {
      return defaultSiteProfile;
    }
    return parsePublishedSiteProfile(setting.published) ?? defaultSiteProfile;
  },
  ["published-site-profile"],
  {
    tags: [SITE_SETTINGS_CACHE_TAG],
    revalidate: 60,
  },
);

export async function getPublishedAppearance(): Promise<AppearanceSettings> {
  return cachedPublishedAppearance();
}

export async function getPublishedSiteProfile(): Promise<SiteProfileSettings> {
  return cachedPublishedSiteProfile();
}

export type SettingRow = {
  draft: unknown;
  published: unknown;
  draftVersion: number;
  publishedVersion: number;
  updatedAt: Date;
};

async function readSettingRow(key: SiteSettingKey): Promise<SettingRow | null> {
  const setting = await readSettingOrDefault(key);
  if (setting === "missing") {
    return null;
  }
  return {
    draft: setting.draft,
    published: setting.published,
    draftVersion: setting.draftVersion,
    publishedVersion: setting.publishedVersion,
    updatedAt: setting.updatedAt,
  };
}

async function ensureSettingRow(key: SiteSettingKey) {
  await db
    .insert(siteSettings)
    .values({ key, draft: {}, published: {} })
    .onConflictDoNothing();
}

export async function getSettingAdmin(key: SiteSettingKey): Promise<SettingRow | null> {
  await ensureSettingRow(key);
  return readSettingRow(key);
}

export async function saveDraftSetting(
  key: SiteSettingKey,
  draft: unknown,
  expectedDraftVersion: number | null,
  actor: AdminActor,
): Promise<{ ok: true; draftVersion: number } | { ok: false; code: string }> {
  await ensureSettingRow(key);

  if (expectedDraftVersion !== null) {
    const current = await readSettingRow(key);
    if (current && current.draftVersion !== expectedDraftVersion) {
      return { ok: false, code: "VERSION_CONFLICT" };
    }
  }

  const nextVersion = (await readSettingRow(key))?.draftVersion ?? 0;

  await db
    .update(siteSettings)
    .set({ draft, draftVersion: nextVersion + 1, updatedBy: actor.userId })
    .where(eq(siteSettings.key, key));

  await recordAdminActivity({
    actor,
    action: key === SITE_SETTING_KEYS.appearance ? "appearance_draft_saved" : "site_profile_draft_saved",
    resourceType: "site_setting",
    resourceId: key,
    afterSummary: { draftVersion: nextVersion + 1 },
  });

  return { ok: true, draftVersion: nextVersion + 1 };
}

export async function publishSetting(
  key: SiteSettingKey,
  expectedDraftVersion: number | null,
  actor: AdminActor,
): Promise<{ ok: true; publishedVersion: number } | { ok: false; code: string }> {
  await ensureSettingRow(key);

  const current = await readSettingRow(key);
  if (!current) {
    return { ok: false, code: "NOT_FOUND" };
  }

  if (expectedDraftVersion !== null && current.draftVersion !== expectedDraftVersion) {
    return { ok: false, code: "VERSION_CONFLICT" };
  }

  const nextPublishedVersion = current.publishedVersion + 1;

  await db
    .insert(siteSettingVersions)
    .values({
      settingKey: key,
      state: "published",
      version: nextPublishedVersion,
      payload: current.draft,
      appliedBy: actor.userId,
    });

  await db
    .update(siteSettings)
    .set({
      published: current.draft,
      publishedVersion: nextPublishedVersion,
      publishedBy: actor.userId,
      updatedBy: actor.userId,
    })
    .where(eq(siteSettings.key, key));

  revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");

  await recordAdminActivity({
    actor,
    action: key === SITE_SETTING_KEYS.appearance ? "appearance_published" : "site_profile_published",
    resourceType: "site_setting",
    resourceId: key,
    afterSummary: { publishedVersion: nextPublishedVersion },
  });

  return { ok: true, publishedVersion: nextPublishedVersion };
}

export async function rollbackSetting(
  key: SiteSettingKey,
  expectedPublishedVersion: number | null,
  actor: AdminActor,
): Promise<{ ok: true; publishedVersion: number; payload: unknown } | { ok: false; code: string }> {
  const current = await readSettingRow(key);
  if (!current) {
    return { ok: false, code: "NOT_FOUND" };
  }

  if (expectedPublishedVersion !== null && current.publishedVersion !== expectedPublishedVersion) {
    return { ok: false, code: "VERSION_CONFLICT" };
  }

  const previous = await db
    .select()
    .from(siteSettingVersions)
    .where(
      and(
        eq(siteSettingVersions.settingKey, key),
        eq(siteSettingVersions.state, "published"),
      ),
    )
    .orderBy(siteSettingVersions.version)
    .limit(1000);

  const history = previous
    .filter((version) => version.version < current.publishedVersion)
    .sort((a, b) => b.version - a.version);

  const target = history[0];

  if (!target) {
    return { ok: false, code: "NO_PREVIOUS_VERSION" };
  }

  await db
    .update(siteSettings)
    .set({ published: target.payload, publishedBy: actor.userId, updatedBy: actor.userId })
    .where(eq(siteSettings.key, key));

  const nextPublishedVersion = current.publishedVersion + 1;
  await db
    .insert(siteSettingVersions)
    .values({
      settingKey: key,
      state: "published",
      version: nextPublishedVersion,
      payload: target.payload,
      appliedBy: actor.userId,
    });

  revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");

  await recordAdminActivity({
    actor,
    action: key === SITE_SETTING_KEYS.appearance ? "appearance_rolled_back" : "site_profile_rolled_back",
    resourceType: "site_setting",
    resourceId: key,
    afterSummary: { publishedVersion: nextPublishedVersion },
  });

  return { ok: true, publishedVersion: nextPublishedVersion, payload: target.payload };
}

export async function canPublishSetting(key: SiteSettingKey): Promise<boolean> {
  const current = await readSettingRow(key);
  return current !== null;
}
