"use client";

type NavigatorWithUA = Navigator & {
  userAgentData?: {
    mobile: boolean;
    platform: string;
    brands: Array<{ brand: string; version: string }>;
  };
};

export type ClientContext = {
  deviceCategory: "mobile" | "tablet" | "desktop";
  browserFamily: string;
  osFamily: string;
};

function normalizeLabel(value: string): string {
  return value.slice(0, 80);
}

export function getClientContext(): ClientContext {
  if (typeof window === "undefined") {
    return { deviceCategory: "desktop", browserFamily: "Lainnya", osFamily: "Lainnya" };
  }

  const ua = window.navigator.userAgent ?? "";
  const uaNavigator = window.navigator as NavigatorWithUA;
  const uaData = uaNavigator.userAgentData;
  const brands = (uaData?.brands ?? []).map((brand) => brand.brand.toLowerCase()).join(" ");

  let browserFamily = "Lainnya";
  if (/\bedg\//i.test(ua) || brands.includes("microsoft edge")) {
    browserFamily = "Edge";
  } else if (/\bopr\/|opera\b|opera mini/i.test(ua)) {
    browserFamily = "Opera";
  } else if (/samsungbrowser|samsung internet/i.test(ua)) {
    browserFamily = "Samsung Internet";
  } else if (brands.includes("google chrome") || /\bchrome\/|chromium\//i.test(ua)) {
    browserFamily = "Chrome";
  } else if (/\bfirefox\/|fxios\//i.test(ua)) {
    browserFamily = "Firefox";
  } else if (/\bsafari\//i.test(ua) || /version\/[\d.]+ safari/i.test(ua)) {
    browserFamily = "Safari";
  }

  let osFamily = "Lainnya";
  const platform = (uaData?.platform ?? "").toLowerCase();
  if (/windows/i.test(ua) || platform.includes("win")) {
    osFamily = "Windows";
  } else if (/cros/i.test(ua)) {
    osFamily = "ChromeOS";
  } else if (/mac os x|macintosh/i.test(ua) || platform.includes("mac")) {
    osFamily = "macOS";
  } else if (/iphone|ipad|ipod/i.test(ua) || platform === "ios") {
    osFamily = "iOS";
  } else if (/android/i.test(ua) || platform.includes("android")) {
    osFamily = "Android";
  } else if (/linux|ubuntu|debian|fedora|arch/i.test(ua) || platform.includes("linux")) {
    osFamily = "Linux";
  }

  let deviceCategory: ClientContext["deviceCategory"] = "desktop";
  const coarse =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse)").matches
      : false;
  if (/ipad|tablet/i.test(ua)) {
    deviceCategory = "tablet";
  } else if (uaData?.mobile || /mobile|android|iphone|ipod/i.test(ua)) {
    deviceCategory = "mobile";
  } else if (coarse) {
    deviceCategory = "mobile";
  }

  return {
    deviceCategory,
    browserFamily: normalizeLabel(browserFamily),
    osFamily: normalizeLabel(osFamily),
  };
}