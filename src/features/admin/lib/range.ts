import type { AnalyticsRange } from "./analytics-queries";

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseRangeFromSearchParams(
  params: URLSearchParams,
): AnalyticsRange {
  const now = new Date();
  const rawFrom = params.get("from");
  const rawTo = params.get("to");

  if (rawFrom && rawTo) {
    const from = new Date(rawFrom);
    const to = new Date(rawTo);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      const limitedFrom = new Date(Math.max(from.getTime(), now.getTime() - 365 * DAY_MS));
      const limitedTo = new Date(Math.min(to.getTime(), now.getTime() + DAY_MS));
      if (limitedTo > limitedFrom) {
        return { from: limitedFrom, to: limitedTo };
      }
    }
  }

  const days = Number(params.get("days") ?? 30);
  const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 1), 365) : 30;

  return {
    from: new Date(now.getTime() - safeDays * DAY_MS),
    to: now,
  };
}