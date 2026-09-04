import type { ValidatedCommodityImport } from "./validate-commodity-import";

export const COMMODITY_DRY_RUN_TABLES = [
  "sources",
  "regions",
  "commodities",
  "contents",
  "content_sources",
  "commodity_contents",
  "commodity_resource_statistics",
  "commodity_resource_statistic_sources",
  "commodity_production_locations",
  "commodity_global_statistic_sets",
  "commodity_global_statistic_entries",
  "commodity_global_statistic_set_sources",
  "commodity_producers",
] as const;

export type CommodityDryRunTable =
  (typeof COMMODITY_DRY_RUN_TABLES)[number];

export type CommodityDryRunExistingKeys = Record<
  CommodityDryRunTable,
  readonly string[]
>;

export type CommodityDryRunTableSummary = {
  table: CommodityDryRunTable;
  planned: number;
  inserts: number;
  updates: number;
};

export type CommodityDryRunPlan = {
  totalPlanned: number;
  totalInserts: number;
  totalUpdates: number;
  tables: CommodityDryRunTableSummary[];
  keys: Record<CommodityDryRunTable, string[]>;
};

export function createCommodityDryRunKey(
  ...parts: Array<string | number | null | undefined>
) {
  return JSON.stringify(
    parts.map((part) => (part === undefined ? null : part)),
  );
}

export function createResourceStatisticKey(
  commoditySlug: string,
  statisticYear: number,
  statisticType: string,
  materialBasis: string | null,
  recordType: string,
) {
  return createCommodityDryRunKey(
    commoditySlug,
    statisticYear,
    statisticType,
    materialBasis,
    recordType,
  );
}

export function createGlobalStatisticSetKey(
  commoditySlug: string,
  statisticYear: number,
  metricCode: string,
  basisCode: string,
  recordType: string,
) {
  return createCommodityDryRunKey(
    commoditySlug,
    statisticYear,
    metricCode,
    basisCode,
    recordType,
  );
}

export function createCommodityDryRunKeys(
  validatedImport: ValidatedCommodityImport,
): Record<CommodityDryRunTable, string[]> {
  const keys = {} as Record<CommodityDryRunTable, string[]>;

  for (const table of COMMODITY_DRY_RUN_TABLES) {
    keys[table] = [];
  }

  for (const source of validatedImport.manifest.sourceCatalog) {
    keys.sources.push(source.slug);
  }

  for (const country of validatedImport.manifest.countryCatalog) {
    keys.regions.push(country.slug);
  }

  for (const { data } of validatedImport.commodityFiles) {
    const commoditySlug = data.commoditySlug;
    const contentSlug = data.profile.slug;

    keys.commodities.push(commoditySlug);
    keys.contents.push(contentSlug);
    keys.commodity_contents.push(
      createCommodityDryRunKey(commoditySlug, contentSlug),
    );

    for (const profileSource of data.profile.sources) {
      keys.content_sources.push(
        createCommodityDryRunKey(contentSlug, profileSource.sourceSlug),
      );
    }

    for (const statistic of data.resourceStatistics) {
      const statisticKey = createResourceStatisticKey(
        commoditySlug,
        statistic.statisticYear,
        statistic.statisticType,
        statistic.materialBasis,
        statistic.recordType,
      );

      keys.commodity_resource_statistics.push(statisticKey);

      for (const source of statistic.supportingSources) {
        keys.commodity_resource_statistic_sources.push(
          createCommodityDryRunKey(
            statisticKey,
            source.sourceSlug,
            source.sourceRole,
            source.citationLabel ?? null,
            source.pageReference ?? null,
          ),
        );
      }
    }

    for (const location of data.productionLocations) {
      keys.commodity_production_locations.push(
        createCommodityDryRunKey(
          commoditySlug,
          location.regionSlug,
          location.recordType,
        ),
      );
    }

    for (const statisticSet of data.globalStatisticSets) {
      const statisticSetKey = createGlobalStatisticSetKey(
        commoditySlug,
        statisticSet.statisticYear,
        statisticSet.metricCode,
        statisticSet.basisCode,
        statisticSet.recordType,
      );

      keys.commodity_global_statistic_sets.push(statisticSetKey);

      for (const entry of statisticSet.entries) {
        keys.commodity_global_statistic_entries.push(
          createCommodityDryRunKey(
            statisticSetKey,
            entry.countryRegionSlug,
          ),
        );
      }

      for (const source of statisticSet.supportingSources) {
        keys.commodity_global_statistic_set_sources.push(
          createCommodityDryRunKey(
            statisticSetKey,
            source.sourceSlug,
            source.sourceRole,
            source.citationLabel ?? null,
            source.pageReference ?? null,
          ),
        );
      }
    }

    for (const producer of data.producers) {
      keys.commodity_producers.push(
        createCommodityDryRunKey(commoditySlug, producer.producerKey),
      );
    }
  }

  for (const table of COMMODITY_DRY_RUN_TABLES) {
    keys[table].sort((left, right) => left.localeCompare(right));
  }

  return keys;
}

export function createCommodityDryRunPlan(
  validatedImport: ValidatedCommodityImport,
  existingKeys: CommodityDryRunExistingKeys,
): CommodityDryRunPlan {
  const plannedKeys = createCommodityDryRunKeys(validatedImport);
  const tables = COMMODITY_DRY_RUN_TABLES.map<CommodityDryRunTableSummary>(
    (table) => {
      const existing = new Set(existingKeys[table]);
      const planned = plannedKeys[table].length;
      const updates = plannedKeys[table].filter((value) =>
        existing.has(value),
      ).length;

      return {
        table,
        planned,
        inserts: planned - updates,
        updates,
      };
    },
  );

  return {
    totalPlanned: tables.reduce((total, table) => total + table.planned, 0),
    totalInserts: tables.reduce((total, table) => total + table.inserts, 0),
    totalUpdates: tables.reduce((total, table) => total + table.updates, 0),
    tables,
    keys: plannedKeys,
  };
}

export function createEmptyCommodityDryRunExistingKeys(): CommodityDryRunExistingKeys {
  const keys = {} as Record<CommodityDryRunTable, string[]>;

  for (const table of COMMODITY_DRY_RUN_TABLES) {
    keys[table] = [];
  }

  return keys;
}
