import "server-only";

import { and, asc, eq, max, min } from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  commodityProduction,
  measurementUnits,
} from "@/db/schema";

import type { PublicProductionOption } from "../types/production";

export async function getPublicProductionOptions(): Promise<
  PublicProductionOption[]
> {
  const rows = await db
    .select({
      name: commodities.name,
      slug: commodities.slug,
      symbol: commodities.symbol,
      fromYear: min(commodityProduction.year),
      toYear: max(commodityProduction.year),
    })
    .from(commodities)
    .innerJoin(
      commodityProduction,
      eq(commodityProduction.commodityId, commodities.id),
    )
    .innerJoin(
      measurementUnits,
      eq(commodityProduction.unitCode, measurementUnits.code),
    )
    .where(
      and(
        eq(commodities.isActive, true),
        eq(commodities.isIntelligenceTracked, true),
        eq(measurementUnits.isActive, true),
        eq(commodityProduction.verificationStatus, "verified"),
        eq(commodityProduction.publicationStatus, "published"),
      ),
    )
    .groupBy(commodities.id)
    .orderBy(asc(commodities.displayOrder), asc(commodities.name));

  return rows.flatMap((row) => {
    if (row.fromYear === null || row.toYear === null) {
      return [];
    }

    return [
      {
        name: row.name,
        slug: row.slug,
        symbol: row.symbol,
        fromYear: Number(row.fromYear),
        toYear: Number(row.toYear),
      },
    ];
  });
}
