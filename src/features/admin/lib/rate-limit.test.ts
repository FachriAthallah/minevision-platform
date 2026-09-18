import { describe, expect, it } from "vitest";

import {
  clearRateLimitBuckets,
  hashIpForRateLimit,
  isRateLimited,
} from "./rate-limit";

describe("rate limit", () => {
  it("mengizinkan request di bawah limit", () => {
    clearRateLimitBuckets();
    expect(isRateLimited("key-a", 3)).toBe(false);
    expect(isRateLimited("key-a", 3)).toBe(false);
    expect(isRateLimited("key-a", 3)).toBe(false);
  });

  it("menolak request melebihi limit", () => {
    clearRateLimitBuckets();
    isRateLimited("key-b", 2);
    isRateLimited("key-b", 2);
    expect(isRateLimited("key-b", 2)).toBe(true);
  });

  it("memisahkan bucket antar key", () => {
    clearRateLimitBuckets();
    isRateLimited("key-c", 1);
    expect(isRateLimited("key-d", 1)).toBe(false);
  });

  it("pattern hashing IP tidak mengandung karakter aneh", () => {
    const hash = hashIpForRateLimit("203.0.113.7");
    expect(hash).toMatch(/^[a-f0-9]{24}$/);
    expect(hash).not.toBe(hashIpForRateLimit("203.0.113.8"));
  });
});