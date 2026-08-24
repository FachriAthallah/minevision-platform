import type {
  ProductionRecordType,
  PublicProductionRecord,
  PublicProductionSource,
} from "../types/production";

export type ProductionChartPoint = {
  year: number;
  historical: number | null;
  historicalType: Exclude<ProductionRecordType, "projection"> | null;
  projection: number | null;
};

export type ProductionStatistics = {
  fromYear: number;
  toYear: number;
  latestYear: number;
  latestValue: number;
  averageValue: number;
  changePercentage: number | null;
  historicalCount: number;
  projectionCount: number;
  unit: PublicProductionRecord["unit"];
};

const historicalPriority: Record<
  Exclude<ProductionRecordType, "projection">,
  number
> = {
  provisional: 1,
  actual: 2,
  revised: 3,
};

export function transformProductionRecords(
  records: PublicProductionRecord[],
): ProductionChartPoint[] {
  const pointsByYear = new Map<
    number,
    ProductionChartPoint & { historicalPriority: number }
  >();

  for (const record of records) {
    const point = pointsByYear.get(record.year) ?? {
      year: record.year,
      historical: null,
      historicalType: null,
      projection: null,
      historicalPriority: 0,
    };

    if (record.recordType === "projection") {
      point.projection = record.value;
    } else {
      const priority = historicalPriority[record.recordType];

      if (priority >= point.historicalPriority) {
        point.historical = record.value;
        point.historicalType = record.recordType;
        point.historicalPriority = priority;
      }
    }

    pointsByYear.set(record.year, point);
  }

  return Array.from(pointsByYear.values())
    .sort((firstPoint, secondPoint) => firstPoint.year - secondPoint.year)
    .map((point) => ({
      year: point.year,
      historical: point.historical,
      historicalType: point.historicalType,
      projection: point.projection,
    }));
}

export function calculateProductionStatistics(
  records: PublicProductionRecord[],
): ProductionStatistics | null {
  if (records.length === 0) {
    return null;
  }

  const unitCodes = new Set(records.map((record) => record.unit.code));

  if (unitCodes.size !== 1) {
    return null;
  }

  const historicalByYear = new Map<
    number,
    PublicProductionRecord & { priority: number }
  >();

  for (const record of records) {
    if (record.recordType === "projection") {
      continue;
    }

    const priority = historicalPriority[record.recordType];
    const current = historicalByYear.get(record.year);

    if (!current || priority >= current.priority) {
      historicalByYear.set(record.year, {
        ...record,
        priority,
      });
    }
  }

  const historicalRecords = Array.from(historicalByYear.values()).sort(
    (firstRecord, secondRecord) => firstRecord.year - secondRecord.year,
  );
  const firstHistoricalRecord = historicalRecords[0];
  const latestHistoricalRecord = historicalRecords.at(-1);

  if (!firstHistoricalRecord || !latestHistoricalRecord) {
    return null;
  }

  const averageValue =
    historicalRecords.reduce((total, record) => total + record.value, 0) /
    historicalRecords.length;
  const changePercentage =
    firstHistoricalRecord.value === 0
      ? null
      : ((latestHistoricalRecord.value - firstHistoricalRecord.value) /
          firstHistoricalRecord.value) *
        100;

  return {
    fromYear: Math.min(...records.map((record) => record.year)),
    toYear: Math.max(...records.map((record) => record.year)),
    latestYear: latestHistoricalRecord.year,
    latestValue: latestHistoricalRecord.value,
    averageValue,
    changePercentage,
    historicalCount: historicalRecords.length,
    projectionCount: records.filter(
      (record) => record.recordType === "projection",
    ).length,
    unit: firstHistoricalRecord.unit,
  };
}

export function getProductionCitations(
  records: PublicProductionRecord[],
): PublicProductionSource[] {
  const citations = new Map<string, PublicProductionSource>();

  for (const citation of records.flatMap((record) => record.sources)) {
    const key = [
      citation.source.slug,
      citation.label,
      citation.pageReference ?? "",
      citation.url ?? "",
    ].join("|");

    citations.set(key, citation);
  }

  return Array.from(citations.values()).sort((first, second) => {
    if (first.isPrimary !== second.isPrimary) {
      return first.isPrimary ? -1 : 1;
    }

    return first.label.localeCompare(second.label, "id-ID");
  });
}
