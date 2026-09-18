import { describe, expect, it } from "vitest";

import { detectImageMime } from "./media-mime";
import { isAdminPath } from "./analytics-paths";
import { parseRangeFromSearchParams } from "./range";

function toBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/../g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  );
}

describe("detectImageMime", () => {
  it("mengenali PNG dari signature", () => {
    expect(detectImageMime(toBytes("89504e470d0a1a0a"))).toBe("image/png");
  });

  it("mengenali JPEG", () => {
    expect(detectImageMime(toBytes("ffd8ff"))).toBe("image/jpeg");
  });

  it("mengenali WebP", () => {
    expect(detectImageMime(toBytes("524946460000000057454250"))).toBe("image/webp");
  });

  it("menolak HTML disguised", () => {
    expect(detectImageMime(new TextEncoder().encode("<!DOCTYPE html>"))).toBeNull();
  });

  it("menolak GIF dan format lain", () => {
    expect(detectImageMime(new TextEncoder().encode("GIF89a"))).toBeNull();
  });
});

describe("isAdminPath", () => {
  it("mengenali path admin", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/traffic")).toBe(true);
  });

  it("menolak path publik", () => {
    expect(isAdminPath("/")).toBe(false);
    expect(isAdminPath("/economy")).toBe(false);
    expect(isAdminPath("/administrator")).toBe(false);
  });
});

describe("parseRangeFromSearchParams", () => {
  it("default 30 hari", () => {
    const range = parseRangeFromSearchParams(new URLSearchParams());
    expect(range.to.getTime() - range.from.getTime()).toBeCloseTo(
      30 * 24 * 60 * 60 * 1000,
      -6,
    );
  });

  it("menerima rentang eksplisit dan membatasi maksimal 365 hari", () => {
    const farPast = new Date(Date.now() - 500 * 24 * 60 * 60 * 1000);
    const range = parseRangeFromSearchParams(
      new URLSearchParams({
        from: farPast.toISOString(),
        to: new Date().toISOString(),
      }),
    );
    expect(range.to.getTime() - range.from.getTime()).toBeLessThanOrEqual(
      365 * 24 * 60 * 60 * 1000,
    );
  });

  it("fallback ke 30 hari jika range tidak valid", () => {
    const range = parseRangeFromSearchParams(
      new URLSearchParams({ from: "bukan-tanggal", to: "bukan-tanggal" }),
    );
    expect(range.to.getTime() - range.from.getTime()).toBeCloseTo(
      30 * 24 * 60 * 60 * 1000,
      -6,
    );
  });
});