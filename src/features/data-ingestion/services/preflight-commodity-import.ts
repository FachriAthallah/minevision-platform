import type {
  CommodityImportManifest,
  CommodityImportFile,
} from "../schemas/commodity-import";
import type { ValidatedCommodityImport } from "./validate-commodity-import";

export type CommodityPreflightRegionRow = {
  id: string;
  slug: string;
  code: string | null;
  level: string;
  isActive: boolean;
};

export type CommodityPreflightSourceRow = {
  slug: string;
  name: string;
  organization: string;
  type: string;
  url: string | null;
};

export type CommodityPreflightContentRow = {
  id: string;
  slug: string;
  type: string;
  linkedCommoditySlug: string | null;
};

export type CommodityPreflightPrimaryContentRow = {
  commoditySlug: string;
  contentSlug: string;
};

export type CommodityPreflightDatabaseState = {
  activeCommoditySlugs: string[];
  activeUnitCodes: string[];
  regions: CommodityPreflightRegionRow[];
  sources: CommodityPreflightSourceRow[];
  activeIndustryCompanySlugs: string[];
  commodityContents: CommodityPreflightContentRow[];
  primaryContentLinks: CommodityPreflightPrimaryContentRow[];
};

export type CommodityPreflightIssue = {
  category:
    | "commodity"
    | "unit"
    | "province"
    | "source"
    | "country"
    | "industry_company"
    | "content";
  key: string;
  message: string;
};

export type CommodityPreflightRequirements = {
  commoditySlugs: string[];
  unitCodes: string[];
  provinceRegionSlugs: string[];
  industryCompanySlugs: string[];
  sourceCatalog: CommodityImportManifest["sourceCatalog"];
  countryCatalog: CommodityImportManifest["countryCatalog"];
  profiles: Array<{
    commoditySlug: string;
    contentSlug: string;
  }>;
};

export type CommodityPreflightReport = {
  passed: boolean;
  requirements: CommodityPreflightRequirements;
  plan: {
    sourcesToCreate: string[];
    sourcesToUpdate: string[];
    countriesToCreate: string[];
    countriesToUpdate: string[];
    profilesToCreate: string[];
    profilesToUpdate: string[];
  };
  issues: CommodityPreflightIssue[];
};

function sorted(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function normalizedUrl(value: string | null) {
  return value?.replace(/\/+$/, "") ?? null;
}

function collectUnitCodes(commodityFile: CommodityImportFile) {
  const unitCodes: string[] = [];

  for (const statistic of commodityFile.resourceStatistics) {
    if (statistic.unitCode !== null) {
      unitCodes.push(statistic.unitCode);
    }
  }

  for (const statisticSet of commodityFile.globalStatisticSets) {
    if (statisticSet.unitCode !== null) {
      unitCodes.push(statisticSet.unitCode);
    }
  }

  return unitCodes;
}

export function collectCommodityPreflightRequirements(
  validatedImport: ValidatedCommodityImport,
): CommodityPreflightRequirements {
  const commoditySlugs = new Set<string>();
  const unitCodes = new Set<string>();
  const provinceRegionSlugs = new Set<string>();
  const industryCompanySlugs = new Set<string>();
  const profiles: CommodityPreflightRequirements["profiles"] = [];

  for (const { data } of validatedImport.commodityFiles) {
    commoditySlugs.add(data.commoditySlug);

    for (const unitCode of collectUnitCodes(data)) {
      unitCodes.add(unitCode);
    }

    for (const location of data.productionLocations) {
      provinceRegionSlugs.add(location.regionSlug);
    }

    for (const producer of data.producers) {
      if (producer.primaryRegionSlug !== null) {
        provinceRegionSlugs.add(producer.primaryRegionSlug);
      }

      if (producer.industryCompanySlug !== null) {
        industryCompanySlugs.add(producer.industryCompanySlug);
      }
    }

    profiles.push({
      commoditySlug: data.commoditySlug,
      contentSlug: data.profile.slug,
    });
  }

  return {
    commoditySlugs: sorted(commoditySlugs),
    unitCodes: sorted(unitCodes),
    provinceRegionSlugs: sorted(provinceRegionSlugs),
    industryCompanySlugs: sorted(industryCompanySlugs),
    sourceCatalog: validatedImport.manifest.sourceCatalog,
    countryCatalog: validatedImport.manifest.countryCatalog,
    profiles: profiles.sort((left, right) =>
      left.commoditySlug.localeCompare(right.commoditySlug),
    ),
  };
}

export function evaluateCommodityPreflight(
  requirements: CommodityPreflightRequirements,
  databaseState: CommodityPreflightDatabaseState,
): CommodityPreflightReport {
  const issues: CommodityPreflightIssue[] = [];
  const activeCommodities = new Set(databaseState.activeCommoditySlugs);
  const activeUnits = new Set(databaseState.activeUnitCodes);
  const activeIndustryCompanies = new Set(
    databaseState.activeIndustryCompanySlugs,
  );
  const regionBySlug = new Map(
    databaseState.regions.map((region) => [region.slug, region]),
  );
  const regionByCode = new Map(
    databaseState.regions
      .filter((region) => region.code !== null)
      .map((region) => [region.code as string, region]),
  );
  const sourceBySlug = new Map(
    databaseState.sources.map((source) => [source.slug, source]),
  );
  const contentBySlug = new Map(
    databaseState.commodityContents.map((content) => [content.slug, content]),
  );
  const primaryContentByCommodity = new Map(
    databaseState.primaryContentLinks.map((link) => [
      link.commoditySlug,
      link.contentSlug,
    ]),
  );

  for (const slug of requirements.commoditySlugs) {
    if (!activeCommodities.has(slug)) {
      issues.push({
        category: "commodity",
        key: slug,
        message: "Komoditas aktif tidak ditemukan",
      });
    }
  }

  for (const code of requirements.unitCodes) {
    if (!activeUnits.has(code)) {
      issues.push({
        category: "unit",
        key: code,
        message: "Measurement unit aktif tidak ditemukan",
      });
    }
  }

  for (const slug of requirements.provinceRegionSlugs) {
    const region = regionBySlug.get(slug);

    if (!region) {
      issues.push({
        category: "province",
        key: slug,
        message: "Region provinsi tidak ditemukan",
      });
    } else if (!region.isActive || region.level !== "province") {
      issues.push({
        category: "province",
        key: slug,
        message:
          "Region harus aktif dan memiliki level province " +
          `(aktual: level=${region.level}, isActive=${region.isActive})`,
      });
    }
  }

  for (const slug of requirements.industryCompanySlugs) {
    if (!activeIndustryCompanies.has(slug)) {
      issues.push({
        category: "industry_company",
        key: slug,
        message: "Industry company aktif tidak ditemukan",
      });
    }
  }

  const sourcesToCreate: string[] = [];
  const sourcesToUpdate: string[] = [];

  for (const source of requirements.sourceCatalog) {
    const existing = sourceBySlug.get(source.slug);

    if (!existing) {
      sourcesToCreate.push(source.slug);
      continue;
    }

    const identityMatches =
      existing.name === source.name &&
      existing.organization === source.organization &&
      existing.type === source.type &&
      (existing.url === null ||
        normalizedUrl(existing.url) === normalizedUrl(source.url));

    if (!identityMatches) {
      issues.push({
        category: "source",
        key: source.slug,
        message:
          "Source slug sudah dipakai oleh identitas sumber yang berbeda",
      });
      continue;
    }

    sourcesToUpdate.push(source.slug);
  }

  const countriesToCreate: string[] = [];
  const countriesToUpdate: string[] = [];

  for (const country of requirements.countryCatalog) {
    const bySlug = regionBySlug.get(country.slug);
    const byCode = regionByCode.get(country.code);

    if (!bySlug && !byCode) {
      countriesToCreate.push(country.slug);
      continue;
    }

    if (
      (bySlug && bySlug.level !== "country") ||
      (byCode && byCode.level !== "country") ||
      (bySlug && bySlug.code !== country.code) ||
      (byCode && byCode.slug !== country.slug) ||
      (bySlug && byCode && bySlug.id !== byCode.id)
    ) {
      issues.push({
        category: "country",
        key: `${country.slug}/${country.code}`,
        message: "Slug atau kode negara bertabrakan dengan region yang ada",
      });
      continue;
    }

    countriesToUpdate.push(country.slug);
  }

  const profilesToCreate: string[] = [];
  const profilesToUpdate: string[] = [];

  for (const profile of requirements.profiles) {
    const existingContent = contentBySlug.get(profile.contentSlug);
    const existingPrimarySlug = primaryContentByCommodity.get(
      profile.commoditySlug,
    );

    if (!existingContent) {
      profilesToCreate.push(profile.contentSlug);
    } else {
      profilesToUpdate.push(profile.contentSlug);

      if (existingContent.type !== "commodity_profile") {
        issues.push({
          category: "content",
          key: profile.contentSlug,
          message: "Content yang ada bukan bertipe commodity_profile",
        });
      }

      if (
        existingContent.linkedCommoditySlug !== null &&
        existingContent.linkedCommoditySlug !== profile.commoditySlug
      ) {
        issues.push({
          category: "content",
          key: profile.contentSlug,
          message:
            "Content sudah terhubung ke komoditas lain: " +
            existingContent.linkedCommoditySlug,
        });
      }
    }

    if (
      existingPrimarySlug !== undefined &&
      existingPrimarySlug !== profile.contentSlug
    ) {
      issues.push({
        category: "content",
        key: profile.commoditySlug,
        message:
          "Komoditas sudah memiliki primary content berbeda: " +
          existingPrimarySlug,
      });
    }
  }

  return {
    passed: issues.length === 0,
    requirements,
    plan: {
      sourcesToCreate: sorted(sourcesToCreate),
      sourcesToUpdate: sorted(sourcesToUpdate),
      countriesToCreate: sorted(countriesToCreate),
      countriesToUpdate: sorted(countriesToUpdate),
      profilesToCreate: sorted(profilesToCreate),
      profilesToUpdate: sorted(profilesToUpdate),
    },
    issues,
  };
}
