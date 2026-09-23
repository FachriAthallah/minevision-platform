import "server-only";

import {
  and,
  asc,
  eq,
  gte,
  isNotNull,
  lt,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

export type AnalyticsRange = {
  from: Date;
  to: Date;
};

export const INTERACTION_EVENT_TYPES = [
  "module_opened",
  "search_submitted",
  "search_result_clicked",
  "related_link_clicked",
  "outbound_source_clicked",
  "cta_clicked",
];

export type OverviewKpis = {
  totalVisitors: number;
  pageviews: number;
  interactions: number;
  bounceRate: number | null;
  totalSessions: number;
};

export async function getOverviewKpis(range: AnalyticsRange): Promise<OverviewKpis> {
  const rows = await db
    .select({
      eventType: analyticsEvents.eventType,
      visitorCount: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
      eventCount: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(analyticsEvents.eventType);

  let pageviews = 0;
  let interactionCount = 0;
  let totalSessions = 0;

  for (const row of rows) {
    if (row.eventType === "page_view") {
      pageviews = row.eventCount;
      totalSessions = row.visitorCount;
    }
    if (INTERACTION_EVENT_TYPES.includes(row.eventType)) {
      interactionCount += row.eventCount;
    }
  }

  const bouncedSessions = await getBouncedSessions(range);

  const bounceRate =
    totalSessions > 0 ? bouncedSessions / totalSessions : null;

  return {
    totalVisitors: totalSessions,
    pageviews,
    interactions: interactionCount,
    bounceRate,
    totalSessions,
  };
}

async function getBouncedSessions(range: AnalyticsRange): Promise<number> {
  const rows = await db
    .select({
      sessionCount: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "page_view"),
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(analyticsEvents.sessionId)
    .having(sql`count(*) = 1`);

  return rows.length;
}

export type DailySeriesPoint = {
  day: string;
  visitors: number;
  pageviews: number;
};

export async function getDailySeries(range: AnalyticsRange): Promise<DailySeriesPoint[]> {
  const rows = await db
    .select({
      day: sql<string>`to_char(${analyticsEvents.occurredAt}, 'YYYY-MM-DD')`,
      eventType: analyticsEvents.eventType,
      visitors: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(
      sql`to_char(${analyticsEvents.occurredAt}, 'YYYY-MM-DD')`,
      analyticsEvents.eventType,
    );

  const byDay = new Map<string, DailySeriesPoint>();

  for (const row of rows) {
    const point = byDay.get(row.day) ?? { day: row.day, visitors: 0, pageviews: 0 };
    point.visitors += row.visitors;
    if (row.eventType === "page_view") {
      point.pageviews += row.count;
    }
    byDay.set(row.day, point);
  }

  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export type TopPageRow = {
  path: string;
  visitors: number;
  pageviews: number;
};

export async function getTopPages(
  range: AnalyticsRange,
  limit = 10,
): Promise<TopPageRow[]> {
  const rows = await db
    .select({
      path: analyticsEvents.path,
      visitors: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
      pageviews: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "page_view"),
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(analyticsEvents.path)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  return rows
    .filter((row): row is TopPageRow => row.path !== null);
}

export type LandingPageRow = {
  path: string;
  sessions: number;
};

export async function getLandingPages(
  range: AnalyticsRange,
  limit = 10,
): Promise<LandingPageRow[]> {
  const firstViews = db
    .selectDistinctOn([analyticsEvents.sessionId], {
      sessionId: analyticsEvents.sessionId,
      path: analyticsEvents.path,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "page_view"),
        isNotNull(analyticsEvents.path),
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .orderBy(analyticsEvents.sessionId, asc(analyticsEvents.occurredAt))
    .as("first_views");

  const rows = await db
    .select({
      path: firstViews.path,
      sessions: sql<number>`count(*)`,
    })
    .from(firstViews)
    .where(isNotNull(firstViews.path))
    .groupBy(firstViews.path)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  return rows.filter(
    (row): row is LandingPageRow => typeof row.path === "string",
  );
}

export async function getTopTrafficSources(
  range: AnalyticsRange,
  limit = 5,
): Promise<Array<{ source: string; visitors: number }>> {
  const sourceExpression = sql`coalesce(nullif(${analyticsEvents.referrerDomain}, ''), 'direct')`;
  const rows = await db
    .select({
      source: sql<string>`${sourceExpression}`.as("source"),
      visitors: sql<number>`count(distinct ${analyticsEvents.sessionId})`.as("visitors"),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "page_view"),
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(sql`${sourceExpression}`)
    .orderBy(sql`count(distinct ${analyticsEvents.sessionId}) desc`)
    .limit(limit);

  return rows.filter(
    (row): row is { source: string; visitors: number } =>
      typeof row.source === "string",
  );
}

export async function getAudienceMetrics(range: AnalyticsRange) {
  const rows = await db
    .select({
      deviceCategory: analyticsEvents.deviceCategory,
      browserFamily: analyticsEvents.browserFamily,
      osFamily: analyticsEvents.osFamily,
      countryCode: analyticsEvents.countryCode,
      visitors: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(
      analyticsEvents.deviceCategory,
      analyticsEvents.browserFamily,
      analyticsEvents.osFamily,
      analyticsEvents.countryCode,
    );

  const devices = new Map<string, number>();
  const browsers = new Map<string, number>();
  const os = new Map<string, number>();
  const countries = new Map<string, number>();

  for (const row of rows) {
    devices.set(
      row.deviceCategory,
      (devices.get(row.deviceCategory) ?? 0) + row.visitors,
    );
    browsers.set(
      row.browserFamily || "Unknown",
      (browsers.get(row.browserFamily || "Unknown") ?? 0) + row.visitors,
    );
    os.set(row.osFamily || "Unknown", (os.get(row.osFamily || "Unknown") ?? 0) + row.visitors);
    countries.set(
      row.countryCode || "Unknown",
      (countries.get(row.countryCode || "Unknown") ?? 0) + row.visitors,
    );
  }

  return {
    devices: [...devices.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    browsers: [...browsers.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    os: [...os.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    countries: [...countries.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
  };
}

export async function getEngagementMetrics(range: AnalyticsRange) {
  const interactionTypes = INTERACTION_EVENT_TYPES;
  const interactionRows = await db
    .select({
      eventType: analyticsEvents.eventType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.eventType} IN (${sql.join(interactionTypes.map((type) => sql.raw(`'${type}'`)), sql`, `)})`,
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(analyticsEvents.eventType);

  const kpis = await getOverviewKpis(range);

  const breakdown = Object.fromEntries(
    interactionRows.map((row) => [row.eventType, row.count]),
  );

  const searchSubmitted = breakdown.search_submitted ?? 0;
  const searchNoResult = await getSearchNoResultCount(range);
  const searchResultClicked = breakdown.search_result_clicked ?? 0;

  return {
    totalInteractions: kpis.interactions,
    interactionsPerSession: kpis.totalSessions > 0 ? kpis.interactions / kpis.totalSessions : 0,
    searchSubmitted,
    searchNoResult,
    searchResultClicked,
    searchSuccessRate:
      searchSubmitted > 0 ? (searchSubmitted - searchNoResult) / searchSubmitted : null,
    searchClickThroughRate:
      searchSubmitted > 0 ? searchResultClicked / searchSubmitted : null,
    ctaClicks: breakdown.cta_clicked ?? 0,
    relatedLinkClicks: breakdown.related_link_clicked ?? 0,
    outboundClicks: breakdown.outbound_source_clicked ?? 0,
    moduleOpened: breakdown.module_opened ?? 0,
    breakdown,
  };
}

export type EngagementEventRow = {
  eventType: string;
  count: number;
  lastRecorded: Date | null;
  previousCount: number;
};

export async function getEngagementEventTable(
  range: AnalyticsRange,
): Promise<EngagementEventRow[]> {
  const interactionTypes = INTERACTION_EVENT_TYPES;
  const inClause = sql`${analyticsEvents.eventType} IN (${sql.join(
    interactionTypes.map((type) => sql.raw(`'${type}'`)),
    sql`, `,
  )})`;
  const spanMs = range.to.getTime() - range.from.getTime();
  const previousFrom = new Date(range.from.getTime() - spanMs);

  const [current, previous] = await Promise.all([
    db
      .select({
        eventType: analyticsEvents.eventType,
        count: sql<number>`count(*)`,
        lastRecorded: sql<Date>`max(${analyticsEvents.occurredAt})`,
      })
      .from(analyticsEvents)
      .where(
        and(
          inClause,
          gte(analyticsEvents.occurredAt, range.from),
          lt(analyticsEvents.occurredAt, range.to),
        ),
      )
      .groupBy(analyticsEvents.eventType),
    db
      .select({
        eventType: analyticsEvents.eventType,
        count: sql<number>`count(*)`,
      })
      .from(analyticsEvents)
      .where(
        and(
          inClause,
          gte(analyticsEvents.occurredAt, previousFrom),
          lt(analyticsEvents.occurredAt, range.from),
        ),
      )
      .groupBy(analyticsEvents.eventType),
  ]);

  const previousCounts = new Map(previous.map((row) => [row.eventType, row.count]));

  return current
    .map((row) => ({
      eventType: row.eventType,
      count: row.count,
      lastRecorded: row.lastRecorded ?? null,
      previousCount: previousCounts.get(row.eventType) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

async function getSearchNoResultCount(range: AnalyticsRange): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "search_submitted"),
        sql`${analyticsEvents.eventProperties}->>'search_status' = 'no_result'`,
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    );

  return rows[0]?.count ?? 0;
}

export async function getVitalsMetrics(range: AnalyticsRange) {
  const rows = await db
    .select({
      metric: sql<string>`${analyticsEvents.eventProperties}->>'metric'`,
      deviceCategory: analyticsEvents.deviceCategory,
      count: sql<number>`count(*)`,
      avg: sql<number>`avg((${analyticsEvents.eventProperties}->>'value')::double precision)`,
      p75: sql<number>`percentile_cont(0.75) within group (order by (${analyticsEvents.eventProperties}->>'value')::double precision)`,
      max: sql<number>`max((${analyticsEvents.eventProperties}->>'value')::double precision)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "web_vital"),
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(sql`1`, analyticsEvents.deviceCategory);

  return rows.map((row) => ({
    metric: row.metric,
    deviceCategory: row.deviceCategory,
    count: row.count,
    avg: row.avg,
    p75: row.p75,
    max: row.max,
  }));
}

export type SlowPageRow = {
  path: string;
  metric: string;
  count: number;
  avg: number;
};

export async function getSlowPages(
  range: AnalyticsRange,
  limit = 10,
): Promise<SlowPageRow[]> {
  const valueExpr = sql`(${analyticsEvents.eventProperties}->>'value')::double precision`;
  const rows = await db
    .select({
      path: analyticsEvents.path,
      metric: sql<string>`${analyticsEvents.eventProperties}->>'metric'`,
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${valueExpr})`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "web_vital"),
        isNotNull(analyticsEvents.path),
        sql`${analyticsEvents.eventProperties}->>'metric' IN ('LCP', 'CLS')`,
        gte(analyticsEvents.occurredAt, range.from),
        lt(analyticsEvents.occurredAt, range.to),
      ),
    )
    .groupBy(analyticsEvents.path, sql`${analyticsEvents.eventProperties}->>'metric'`)
    .orderBy(sql`avg(${valueExpr}) desc`)
    .limit(limit);

  return rows.filter(
    (row): row is SlowPageRow =>
      typeof row.path === "string" && typeof row.metric === "string",
  );
}