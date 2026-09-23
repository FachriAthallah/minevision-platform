import { z } from "zod";

function httpsOnlyUrl(errorMessage: string) {
  return z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || /^https:\/\//i.test(value), {
      message: errorMessage,
    })
    .refine((value) => value === "" || !/^(javascript|data|vbscript):/i.test(value), {
      message: "Protocol tidak diizinkan.",
    });
}

function safeText(max: number) {
  return z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max));
}

export const appearanceSchema = z.object({
  logo: z.string().max(300).optional().default(""),
  logoCompact: z.string().max(300).optional().default(""),
  favicon: z.string().max(300).optional().default(""),
  heroImage: z.string().max(300).optional().default(""),
  heroAltText: safeText(200),
  heroFocalPoint: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional()
    .default({ x: 50, y: 50 }),
  overlayOpacity: z.number().min(0).max(0.9).default(0.5),
});

export const socialLinkSchema = z.object({
  label: safeText(60),
  url: httpsOnlyUrl("Tautan harus menggunakan https."),
});

export const officialSourceLinkSchema = z.object({
  label: safeText(120),
  url: httpsOnlyUrl("Tautan harus menggunakan https."),
});

export const siteProfileSchema = z.object({
  name: safeText(80),
  tagline: safeText(200),
  description: safeText(1000),
  footerDescription: safeText(500),
  contactEmail: z
    .union([z.email().trim(), z.literal("")])
    .default(""),
  contactPhone: safeText(40),
  organizationAddress: safeText(300),
  seoTitle: safeText(160),
  seoDescription: safeText(320),
  footerCopyright: safeText(200),
  socialLinks: z.array(socialLinkSchema).max(12).default([]),
  officialSources: z.array(officialSourceLinkSchema).max(12).default([]),
});

export type AppearanceSettings = z.infer<typeof appearanceSchema>;
export type SiteProfileSettings = z.infer<typeof siteProfileSchema>;

export const adminAnalyticsEventSchema = z
  .object({
    event_type: z.enum([
      "page_view",
      "module_opened",
      "search_submitted",
      "search_result_clicked",
      "related_link_clicked",
      "outbound_source_clicked",
      "cta_clicked",
      "session_started",
    ]),
    session_id: z.string().regex(/^[a-z0-9-_]{8,64}$/i),
    path: z.string().min(1).max(500),
    module: z.string().max(64).optional(),
    referrer_domain: z.string().max(255).optional(),
    device_category: z
      .enum(["desktop", "mobile", "tablet", "unknown"])
      .default("unknown"),
    browser_family: z.string().max(80).optional(),
    os_family: z.string().max(80).optional(),
    country_code: z.string().regex(/^[A-Z]{2}$/).optional(),
    properties: z
      .object({
        search_category: z.string().max(80).optional(),
        search_query_length: z.number().int().min(0).max(512).optional(),
        search_result_count: z.number().int().min(0).max(100000).optional(),
        search_status: z
          .enum(["success", "no_result", "failed"])
          .optional(),
        clicked_index: z.number().int().min(0).max(200).optional(),
        click_target: z.string().max(255).optional(),
        module: z.string().max(64).optional(),
      })
      .strict()
      .default({}),
  })
  .strict();

export const adminWebVitalSchema = z
  .object({
    metric: z.enum(["LCP", "INP", "CLS", "TTFB", "FCP"]),
    value: z.number().finite().nonnegative().max(300000),
    path: z.string().min(1).max(500),
    device_category: z
      .enum(["desktop", "mobile", "tablet", "unknown"])
      .default("unknown"),
    browser_family: z.string().max(80).optional(),
    os_family: z.string().max(80).optional(),
    country_code: z.string().regex(/^[A-Z]{2}$/).optional(),
  })
  .strict();

export const adminEventQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  offset: z.coerce.number().int().min(0).max(10000).optional().default(0),
  action: z.string().max(120).optional(),
  resource_type: z.string().max(80).optional(),
  status: z.enum(["success", "failure"]).optional(),
  actor_id: z.string().max(64).optional(),
});