"use client";

import { useReportWebVitals } from "next/web-vitals";
import { isAdminPath } from "@/features/admin/lib/analytics-paths";
import { getClientContext } from "@/features/admin/lib/client-context";

type VitalsMetric = {
  name?: string;
  startTime?: number;
  value?: number;
  rating?: string;
  id?: string;
};

function isSupportedVital(metric: VitalsMetric): boolean {
  return ["LCP", "INP", "CLS", "TTFB", "FCP"].includes(metric.name ?? "");
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const safeMetric = metric as VitalsMetric;

    if (!isSupportedVital(safeMetric)) {
      return;
    }

    const name = safeMetric.name ?? "";
    const value = safeMetric.value ?? 0;
    const path = window.location.pathname;

    if (isAdminPath(path)) {
      return;
    }

    if (!Number.isFinite(value) || value < 0 || value > 300000) {
      return;
    }

    const ctx = getClientContext();

    if (navigator.sendBeacon) {
      const blob = new Blob(
        [
          JSON.stringify({
            metric: name,
            value,
            path: path.length > 500 ? path.slice(0, 500) : path,
            device_category: ctx.deviceCategory,
            browser_family: ctx.browserFamily,
            os_family: ctx.osFamily,
          }),
        ],
        { type: "application/json" },
      );
      navigator.sendBeacon("/api/v1/analytics/vitals", blob);
    }
  });

  return null;
}