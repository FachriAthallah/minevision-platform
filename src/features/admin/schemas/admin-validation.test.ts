import { describe, expect, it } from "vitest";

import {
  adminAnalyticsEventSchema,
  adminWebVitalSchema,
  appearanceSchema,
  siteProfileSchema,
} from "./admin-validation";

describe("appearanceSchema", () => {
  it("menerima nilai default yang valid", () => {
    const parsed = appearanceSchema.parse({
      logo: "",
      logoCompact: "",
      favicon: "",
      heroImage: "",
      heroAltText: "Gambar hero pertambangan",
      heroFocalPoint: { x: 50, y: 50 },
      overlayOpacity: 0.5,
    });
    expect(parsed.overlayOpacity).toBe(0.5);
  });

  it("menolak overlay opacity di luar rentang aman", () => {
    expect(() =>
      appearanceSchema.parse({ overlayOpacity: 1.2 }),
    ).toThrow();
  });

  it("menolak focal point di luar 0-100", () => {
    expect(() =>
      appearanceSchema.parse({ heroFocalPoint: { x: 150, y: 50 } }),
    ).toThrow();
  });
});

describe("siteProfileSchema", () => {
  it("menolak URL berbahaya pada social link", () => {
    expect(() =>
      siteProfileSchema.parse({
        name: "MineVision",
        tagline: "",
        description: "",
        footerDescription: "",
        contactEmail: "",
        contactPhone: "",
        organizationAddress: "",
        seoTitle: "",
        seoDescription: "",
        footerCopyright: "",
        socialLinks: [{ label: "Evil", url: "javascript:alert(1)" }],
        officialSources: [],
      }),
    ).toThrow();
  });

  it("menerima https pada official source", () => {
    const parsed = siteProfileSchema.parse({
      name: "MineVision",
      tagline: "",
      description: "",
      footerDescription: "",
      contactEmail: "",
      contactPhone: "",
      organizationAddress: "",
      seoTitle: "",
      seoDescription: "",
      footerCopyright: "",
      socialLinks: [],
      officialSources: [{ label: "ESDM", url: "https://www.esdm.go.id/" }],
    });
    expect(parsed.officialSources[0].url).toBe("https://www.esdm.go.id/");
  });

  it("menolak email tidak valid", () => {
    expect(() =>
      siteProfileSchema.parse({
        name: "MineVision",
        tagline: "",
        description: "",
        footerDescription: "",
        contactEmail: "bukan-email",
        contactPhone: "",
        organizationAddress: "",
        seoTitle: "",
        seoDescription: "",
        footerCopyright: "",
        socialLinks: [],
        officialSources: [],
      }),
    ).toThrow();
  });
});

describe("adminAnalyticsEventSchema", () => {
  it("menolak event type tidak dikenal", () => {
    expect(() =>
      adminAnalyticsEventSchema.parse({
        event_type: "invisible_event",
        session_id: "s_abc12345",
        path: "/home",
      }),
    ).toThrow();
  });

  it("menolak session id terlalu pendek", () => {
    expect(() =>
      adminAnalyticsEventSchema.parse({
        event_type: "page_view",
        session_id: "abc",
        path: "/home",
      }),
    ).toThrow();
  });

  it("menolak field tambahan (strict)", () => {
    expect(() =>
      adminAnalyticsEventSchema.parse({
        event_type: "page_view",
        session_id: "s_abc12345",
        path: "/home",
        raw_query: "sensitif",
      }),
    ).toThrow();
  });

  it("menolak menyimpan isi query sensitif", () => {
    const parsed = adminAnalyticsEventSchema.safeParse({
      event_type: "search_submitted",
      session_id: "s_abc12345",
      path: "/search",
      properties: {
        search_query_raw: "NIK pengguna",
      },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("adminWebVitalSchema", () => {
  it("menerima metrik LCP valid", () => {
    const parsed = adminWebVitalSchema.parse({
      metric: "LCP",
      value: 1800,
      path: "/home",
      device_category: "desktop",
    });
    expect(parsed.value).toBe(1800);
  });

  it("menolak nilai negatif", () => {
    expect(() =>
      adminWebVitalSchema.parse({ metric: "CLS", value: -1, path: "/home" }),
    ).toThrow();
  });

  it("menolak metrik tidak dikenal", () => {
    expect(() =>
      adminWebVitalSchema.parse({ metric: "TTI", value: 100, path: "/home" }),
    ).toThrow();
  });
});