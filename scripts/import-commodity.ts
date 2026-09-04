import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

import {
  createGlobalStatisticSetKey,
  createResourceStatisticKey,
} from "../src/features/data-ingestion/services/dry-run-commodity-import";
import {
  assertCommodityApplyFlag,
  executeCommodityImportSteps,
  type CommodityImportStepWriter,
  type CommodityImportTable,
} from "../src/features/data-ingestion/services/import-commodity";
import {
  collectCommodityPreflightRequirements,
  evaluateCommodityPreflight,
  type CommodityPreflightContentRow,
  type CommodityPreflightPrimaryContentRow,
  type CommodityPreflightRegionRow,
  type CommodityPreflightSourceRow,
} from "../src/features/data-ingestion/services/preflight-commodity-import";
import {
  validateCommodityImport,
  validateCommodityManifest,
  type CommodityImportFileInput,
  type CommodityValidationIssue,
  type ValidatedCommodityImport,
} from "../src/features/data-ingestion/services/validate-commodity-import";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.",
  );
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
});

type DatabaseTransaction = postgres.TransactionSql<Record<string, never>>;
type IdRow = { id: string };
type SlugIdRow = IdRow & { slug: string };
type IndustryCompanyRow = SlugIdRow & { isActive: boolean };
type ExistingEntryRow = { countryRegionId: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Kesalahan tidak diketahui";
}

function printValidationIssues(issues: CommodityValidationIssue[]) {
  console.error("\nDataset Commodity tidak valid:");

  for (const issue of issues) {
    console.error(
      `- ${issue.filePath} :: ${issue.path} ` +
        `[${issue.code}]: ${issue.message}`,
    );
  }
}

async function loadValidatedImport(
  manifestArgument: string,
): Promise<ValidatedCommodityImport | null> {
  const manifestPath = resolve(process.cwd(), manifestArgument);
  let manifestInput: unknown;

  try {
    const status = await lstat(manifestPath);

    if (!status.isFile()) {
      printValidationIssues([
        {
          filePath: manifestArgument,
          path: "root",
          code: "not_regular_file",
          message: "Manifest harus berupa regular file dan bukan symbolic link",
        },
      ]);
      return null;
    }

    manifestInput = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    printValidationIssues([
      {
        filePath: manifestArgument,
        path: "root",
        code: "invalid_json_or_file",
        message:
          "Manifest tidak dapat dibaca sebagai JSON valid: " +
          getErrorMessage(error),
      },
    ]);
    return null;
  }

  const manifestResult = validateCommodityManifest(
    manifestInput,
    manifestArgument,
  );

  if (!manifestResult.success) {
    printValidationIssues(manifestResult.issues);
    return null;
  }

  const manifestDirectory = dirname(manifestPath);
  const fileInputs: CommodityImportFileInput[] = [];
  const loadIssues: CommodityValidationIssue[] = [];

  for (const entry of manifestResult.data.commodityFiles) {
    const filePath = resolve(manifestDirectory, entry.filePath);

    try {
      const status = await lstat(filePath);

      if (!status.isFile()) {
        loadIssues.push({
          filePath: entry.filePath,
          path: "root",
          code: "not_regular_file",
          message: "Target harus berupa regular file dan bukan symbolic link",
        });
        continue;
      }

      fileInputs.push({
        filePath: entry.filePath,
        input: JSON.parse(await readFile(filePath, "utf8")) as unknown,
      });
    } catch (error) {
      loadIssues.push({
        filePath: entry.filePath,
        path: "root",
        code: "invalid_json_or_file",
        message: `File tidak dapat dibaca sebagai JSON valid: ${getErrorMessage(error)}`,
      });
    }
  }

  const validationResult = validateCommodityImport(
    manifestInput,
    fileInputs,
    manifestArgument,
  );

  if (loadIssues.length > 0 || !validationResult.success) {
    const unavailableFiles = new Set(
      loadIssues.map((issue) => issue.filePath),
    );
    const validationIssues = validationResult.success
      ? []
      : validationResult.issues.filter(
          (issue) =>
            issue.code !== "missing_file" ||
            !unavailableFiles.has(issue.filePath),
        );

    printValidationIssues([...loadIssues, ...validationIssues]);
    return null;
  }

  return validationResult.data;
}

async function readPreflightState(transaction: DatabaseTransaction) {
  const commodityRows = await transaction<{ slug: string }[]>`
    SELECT slug
    FROM public.commodities
    WHERE is_active = true;
  `;
  const unitRows = await transaction<{ code: string }[]>`
    SELECT code
    FROM public.measurement_units
    WHERE is_active = true;
  `;
  const regionRows = await transaction<CommodityPreflightRegionRow[]>`
    SELECT
      id::text AS id,
      slug,
      code,
      level::text AS level,
      is_active AS "isActive"
    FROM public.regions;
  `;
  const sourceRows = await transaction<CommodityPreflightSourceRow[]>`
    SELECT slug, name, organization, type::text AS type, url
    FROM public.sources;
  `;
  const industryCompanyRows = await transaction<{ slug: string }[]>`
    SELECT slug
    FROM public.industry_companies
    WHERE is_active = true;
  `;
  const contentRows = await transaction<CommodityPreflightContentRow[]>`
    SELECT
      content.id::text AS id,
      content.slug,
      content.type::text AS type,
      linked_commodity.slug AS "linkedCommoditySlug"
    FROM public.contents AS content
    LEFT JOIN public.commodity_contents AS commodity_content
      ON commodity_content.content_id = content.id
    LEFT JOIN public.commodities AS linked_commodity
      ON linked_commodity.id = commodity_content.commodity_id
    WHERE content.module = 'commodities';
  `;
  const primaryContentRows =
    await transaction<CommodityPreflightPrimaryContentRow[]>`
      SELECT
        commodity.slug AS "commoditySlug",
        content.slug AS "contentSlug"
      FROM public.commodity_contents AS commodity_content
      INNER JOIN public.commodities AS commodity
        ON commodity.id = commodity_content.commodity_id
      INNER JOIN public.contents AS content
        ON content.id = commodity_content.content_id
      WHERE commodity_content.is_primary = true;
    `;

  return {
    activeCommoditySlugs: commodityRows.map((row) => row.slug),
    activeUnitCodes: unitRows.map((row) => row.code),
    regions: regionRows,
    sources: sourceRows,
    activeIndustryCompanySlugs: industryCompanyRows.map((row) => row.slug),
    commodityContents: contentRows,
    primaryContentLinks: primaryContentRows,
  };
}

function requireId(map: Map<string, string>, key: string, label: string) {
  const id = map.get(key);

  if (!id) {
    throw new Error(`${label} tidak ditemukan setelah preflight: ${key}`);
  }

  return id;
}

class PostgresCommodityImportWriter {
  private readonly sourceIdBySlug = new Map<string, string>();
  private readonly regionIdBySlug = new Map<string, string>();
  private readonly commodityIdBySlug = new Map<string, string>();
  private readonly contentIdBySlug = new Map<string, string>();
  private readonly industryCompanyIdBySlug = new Map<string, string>();
  private readonly resourceStatisticIdByKey = new Map<string, string>();
  private readonly globalStatisticSetIdByKey = new Map<string, string>();

  constructor(private readonly transaction: DatabaseTransaction) {}

  async initializeReferenceMaps() {
    const [sources, regions, commodities, contents, industryCompanies] =
      await Promise.all([
        this.transaction<SlugIdRow[]>`
          SELECT id::text AS id, slug FROM public.sources;
        `,
        this.transaction<SlugIdRow[]>`
          SELECT id::text AS id, slug FROM public.regions;
        `,
        this.transaction<SlugIdRow[]>`
          SELECT id::text AS id, slug FROM public.commodities;
        `,
        this.transaction<SlugIdRow[]>`
          SELECT id::text AS id, slug
          FROM public.contents
          WHERE module = 'commodities';
        `,
        this.transaction<IndustryCompanyRow[]>`
          SELECT id::text AS id, slug, is_active AS "isActive"
          FROM public.industry_companies;
        `,
      ]);

    for (const row of sources) this.sourceIdBySlug.set(row.slug, row.id);
    for (const row of regions) this.regionIdBySlug.set(row.slug, row.id);
    for (const row of commodities) {
      this.commodityIdBySlug.set(row.slug, row.id);
    }
    for (const row of contents) this.contentIdBySlug.set(row.slug, row.id);
    for (const row of industryCompanies) {
      if (row.isActive) {
        this.industryCompanyIdBySlug.set(row.slug, row.id);
      }
    }
  }

  readonly writeStep: CommodityImportStepWriter = async (
    table,
    validatedImport,
  ) => {
    switch (table) {
      case "sources":
        return this.upsertSources(validatedImport);
      case "regions":
        return this.upsertCountries(validatedImport);
      case "commodities":
        return this.updateCommodities(validatedImport);
      case "contents":
        return this.upsertContents(validatedImport);
      case "content_sources":
        return this.upsertContentSources(validatedImport);
      case "commodity_contents":
        return this.upsertCommodityContents(validatedImport);
      case "commodity_resource_statistics":
        return this.upsertResourceStatistics(validatedImport);
      case "commodity_resource_statistic_sources":
        return this.upsertResourceStatisticSources(validatedImport);
      case "commodity_production_locations":
        return this.upsertProductionLocations(validatedImport);
      case "commodity_global_statistic_sets":
        return this.upsertGlobalStatisticSets(validatedImport);
      case "commodity_global_statistic_entries":
        return this.upsertGlobalStatisticEntries(validatedImport);
      case "commodity_global_statistic_set_sources":
        return this.upsertGlobalStatisticSetSources(validatedImport);
      case "commodity_producers":
        return this.upsertProducers(validatedImport);
      default:
        return this.assertNever(table);
    }
  };

  private assertNever(table: never): never {
    throw new Error(`Tahap importer tidak dikenal: ${String(table)}`);
  }

  private async upsertSources(validatedImport: ValidatedCommodityImport) {
    let processed = 0;

    for (const source of validatedImport.manifest.sourceCatalog) {
      const [row] = await this.transaction<IdRow[]>`
        INSERT INTO public.sources (
          name,
          slug,
          type,
          organization,
          url,
          description,
          is_official,
          verification_status,
          verified_at,
          is_active
        ) VALUES (
          ${source.name},
          ${source.slug},
          ${source.type},
          ${source.organization},
          ${source.url},
          ${source.description ?? null},
          ${source.isOfficial},
          ${source.verificationStatus},
          NOW(),
          true
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          organization = EXCLUDED.organization,
          url = EXCLUDED.url,
          description = EXCLUDED.description,
          is_official = EXCLUDED.is_official,
          verification_status = EXCLUDED.verification_status,
          verified_at = COALESCE(public.sources.verified_at, NOW()),
          is_active = true,
          updated_at = NOW()
        RETURNING id::text AS id;
      `;

      this.sourceIdBySlug.set(source.slug, row.id);
      processed += 1;
    }

    return processed;
  }

  private async upsertCountries(validatedImport: ValidatedCommodityImport) {
    let processed = 0;

    for (const country of validatedImport.manifest.countryCatalog) {
      const [row] = await this.transaction<IdRow[]>`
        INSERT INTO public.regions (
          code,
          name,
          slug,
          level,
          is_active
        ) VALUES (
          ${country.code},
          ${country.name},
          ${country.slug},
          'country',
          true
        )
        ON CONFLICT (slug) DO UPDATE SET
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          level = 'country',
          is_active = true,
          updated_at = NOW()
        RETURNING id::text AS id;
      `;

      this.regionIdBySlug.set(country.slug, row.id);
      processed += 1;
    }

    return processed;
  }

  private async updateCommodities(validatedImport: ValidatedCommodityImport) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const image = data.commodity.image;
      const [row] = await this.transaction<IdRow[]>`
        UPDATE public.commodities
        SET
          description = ${data.commodity.description},
          specification = ${data.commodity.specification},
          image_url = ${image?.imageUrl ?? null},
          image_alt = ${image?.imageAlt ?? null},
          image_credit = ${image?.imageCredit ?? null},
          image_source_url = ${image?.imageSourceUrl ?? null},
          updated_at = NOW()
        WHERE slug = ${data.commoditySlug}
          AND is_active = true
        RETURNING id::text AS id;
      `;

      if (!row) {
        throw new Error(
          `Komoditas aktif tidak ditemukan saat update: ${data.commoditySlug}`,
        );
      }

      this.commodityIdBySlug.set(data.commoditySlug, row.id);
      processed += 1;
    }

    return processed;
  }

  private async upsertContents(validatedImport: ValidatedCommodityImport) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const profile = data.profile;
      const [row] = await this.transaction<IdRow[]>`
        INSERT INTO public.contents (
          module,
          type,
          title,
          slug,
          excerpt,
          body,
          cover_image_url,
          status,
          published_at,
          reading_time_minutes,
          is_featured
        ) VALUES (
          'commodities',
          'commodity_profile',
          ${profile.title},
          ${profile.slug},
          ${profile.excerpt},
          ${profile.body},
          ${data.commodity.image?.imageUrl ?? null},
          ${profile.publicationStatus},
          ${profile.publishedAt},
          ${profile.readingTimeMinutes ?? null},
          ${profile.isFeatured}
        )
        ON CONFLICT (module, slug) DO UPDATE SET
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          body = EXCLUDED.body,
          cover_image_url = EXCLUDED.cover_image_url,
          status = EXCLUDED.status,
          published_at = EXCLUDED.published_at,
          reading_time_minutes = EXCLUDED.reading_time_minutes,
          is_featured = EXCLUDED.is_featured,
          updated_at = NOW()
        RETURNING id::text AS id;
      `;

      this.contentIdBySlug.set(profile.slug, row.id);
      processed += 1;
    }

    return processed;
  }

  private async upsertContentSources(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const contentId = requireId(
        this.contentIdBySlug,
        data.profile.slug,
        "Content",
      );

      for (const [index, source] of data.profile.sources.entries()) {
        const sourceId = requireId(
          this.sourceIdBySlug,
          source.sourceSlug,
          "Source",
        );

        await this.transaction`
          INSERT INTO public.content_sources (
            content_id,
            source_id,
            citation_label,
            page_reference,
            display_order
          ) VALUES (
            ${contentId},
            ${sourceId},
            ${source.citationLabel ?? null},
            ${source.pageReference ?? null},
            ${index}
          )
          ON CONFLICT (content_id, source_id) DO UPDATE SET
            citation_label = EXCLUDED.citation_label,
            page_reference = EXCLUDED.page_reference,
            display_order = EXCLUDED.display_order,
            updated_at = NOW();
        `;

        processed += 1;
      }
    }

    return processed;
  }

  private async upsertCommodityContents(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const commodityId = requireId(
        this.commodityIdBySlug,
        data.commoditySlug,
        "Commodity",
      );
      const contentId = requireId(
        this.contentIdBySlug,
        data.profile.slug,
        "Content",
      );

      await this.transaction`
        INSERT INTO public.commodity_contents (
          commodity_id,
          content_id,
          is_primary,
          display_order
        ) VALUES (
          ${commodityId},
          ${contentId},
          true,
          0
        )
        ON CONFLICT (commodity_id, content_id) DO UPDATE SET
          is_primary = true,
          display_order = 0,
          updated_at = NOW();
      `;

      processed += 1;
    }

    return processed;
  }

  private async upsertResourceStatistics(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const commodityId = requireId(
        this.commodityIdBySlug,
        data.commoditySlug,
        "Commodity",
      );

      for (const statistic of data.resourceStatistics) {
        const sourceId = requireId(
          this.sourceIdBySlug,
          statistic.primarySource.sourceSlug,
          "Source",
        );
        const query = statistic.materialBasis === null
          ? this.transaction<IdRow[]>`
              INSERT INTO public.commodity_resource_statistics (
                commodity_id,
                statistic_year,
                statistic_type,
                material_basis,
                availability_status,
                value,
                unit_code,
                record_type,
                source_id,
                source_url,
                page_reference,
                verification_status,
                publication_status,
                notes
              ) VALUES (
                ${commodityId},
                ${statistic.statisticYear},
                ${statistic.statisticType},
                NULL,
                ${statistic.availabilityStatus},
                ${statistic.value},
                ${statistic.unitCode},
                ${statistic.recordType},
                ${sourceId},
                ${statistic.primarySource.sourceUrl ?? null},
                ${statistic.primarySource.pageReference ?? null},
                ${statistic.verificationStatus},
                ${statistic.publicationStatus},
                ${statistic.notes}
              )
              ON CONFLICT (
                commodity_id,
                statistic_year,
                statistic_type,
                record_type
              ) WHERE material_basis IS NULL
              DO UPDATE SET
                availability_status = EXCLUDED.availability_status,
                value = EXCLUDED.value,
                unit_code = EXCLUDED.unit_code,
                source_id = EXCLUDED.source_id,
                source_url = EXCLUDED.source_url,
                page_reference = EXCLUDED.page_reference,
                verification_status = EXCLUDED.verification_status,
                publication_status = EXCLUDED.publication_status,
                notes = EXCLUDED.notes,
                updated_at = NOW()
              RETURNING id::text AS id;
            `
          : this.transaction<IdRow[]>`
              INSERT INTO public.commodity_resource_statistics (
                commodity_id,
                statistic_year,
                statistic_type,
                material_basis,
                availability_status,
                value,
                unit_code,
                record_type,
                source_id,
                source_url,
                page_reference,
                verification_status,
                publication_status,
                notes
              ) VALUES (
                ${commodityId},
                ${statistic.statisticYear},
                ${statistic.statisticType},
                ${statistic.materialBasis},
                ${statistic.availabilityStatus},
                ${statistic.value},
                ${statistic.unitCode},
                ${statistic.recordType},
                ${sourceId},
                ${statistic.primarySource.sourceUrl ?? null},
                ${statistic.primarySource.pageReference ?? null},
                ${statistic.verificationStatus},
                ${statistic.publicationStatus},
                ${statistic.notes}
              )
              ON CONFLICT (
                commodity_id,
                statistic_year,
                statistic_type,
                material_basis,
                record_type
              ) WHERE material_basis IS NOT NULL
              DO UPDATE SET
                availability_status = EXCLUDED.availability_status,
                value = EXCLUDED.value,
                unit_code = EXCLUDED.unit_code,
                source_id = EXCLUDED.source_id,
                source_url = EXCLUDED.source_url,
                page_reference = EXCLUDED.page_reference,
                verification_status = EXCLUDED.verification_status,
                publication_status = EXCLUDED.publication_status,
                notes = EXCLUDED.notes,
                updated_at = NOW()
              RETURNING id::text AS id;
            `;
        const [row] = await query;
        const key = createResourceStatisticKey(
          data.commoditySlug,
          statistic.statisticYear,
          statistic.statisticType,
          statistic.materialBasis,
          statistic.recordType,
        );

        this.resourceStatisticIdByKey.set(key, row.id);
        processed += 1;
      }
    }

    return processed;
  }

  private async upsertResourceStatisticSources(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      for (const statistic of data.resourceStatistics) {
        const statisticKey = createResourceStatisticKey(
          data.commoditySlug,
          statistic.statisticYear,
          statistic.statisticType,
          statistic.materialBasis,
          statistic.recordType,
        );
        const statisticId = requireId(
          this.resourceStatisticIdByKey,
          statisticKey,
          "Resource statistic",
        );

        for (const source of statistic.supportingSources) {
          const sourceId = requireId(
            this.sourceIdBySlug,
            source.sourceSlug,
            "Source",
          );

          await this.transaction`
            INSERT INTO public.commodity_resource_statistic_sources (
              resource_statistic_id,
              source_id,
              source_role,
              citation_label,
              source_url,
              page_reference
            ) VALUES (
              ${statisticId},
              ${sourceId},
              ${source.sourceRole},
              ${source.citationLabel ?? null},
              ${source.sourceUrl ?? null},
              ${source.pageReference ?? null}
            )
            ON CONFLICT (
              resource_statistic_id,
              source_id,
              source_role,
              COALESCE(citation_label, ''),
              COALESCE(page_reference, '')
            ) DO UPDATE SET
              source_url = EXCLUDED.source_url,
              updated_at = NOW();
          `;

          processed += 1;
        }
      }
    }

    return processed;
  }

  private async upsertProductionLocations(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const commodityId = requireId(
        this.commodityIdBySlug,
        data.commoditySlug,
        "Commodity",
      );

      for (const location of data.productionLocations) {
        const regionId = requireId(
          this.regionIdBySlug,
          location.regionSlug,
          "Province region",
        );
        const sourceId = requireId(
          this.sourceIdBySlug,
          location.primarySource.sourceSlug,
          "Source",
        );

        await this.transaction`
          INSERT INTO public.commodity_production_locations (
            commodity_id,
            region_id,
            year,
            production_value,
            unit_code,
            share_percentage,
            producer_rank,
            record_type,
            source_id,
            verification_status,
            publication_status,
            notes,
            location_detail
          ) VALUES (
            ${commodityId},
            ${regionId},
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            ${location.recordType},
            ${sourceId},
            ${location.verificationStatus},
            ${location.publicationStatus},
            ${location.notes},
            ${location.locationDetail}
          )
          ON CONFLICT (
            commodity_id,
            region_id,
            record_type
          ) WHERE year IS NULL
          DO UPDATE SET
            source_id = EXCLUDED.source_id,
            verification_status = EXCLUDED.verification_status,
            publication_status = EXCLUDED.publication_status,
            notes = EXCLUDED.notes,
            location_detail = EXCLUDED.location_detail,
            updated_at = NOW();
        `;

        processed += 1;
      }
    }

    return processed;
  }

  private async upsertGlobalStatisticSets(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const commodityId = requireId(
        this.commodityIdBySlug,
        data.commoditySlug,
        "Commodity",
      );

      for (const statisticSet of data.globalStatisticSets) {
        const primarySource = statisticSet.primarySource;
        const sourceId = primarySource
          ? requireId(
              this.sourceIdBySlug,
              primarySource.sourceSlug,
              "Source",
            )
          : null;
        const [row] = await this.transaction<IdRow[]>`
          INSERT INTO public.commodity_global_statistic_sets (
            commodity_id,
            statistic_year,
            metric_code,
            basis_code,
            unit_code,
            availability_status,
            record_type,
            source_id,
            source_url,
            page_reference,
            verification_status,
            publication_status,
            notes
          ) VALUES (
            ${commodityId},
            ${statisticSet.statisticYear},
            ${statisticSet.metricCode},
            ${statisticSet.basisCode},
            ${statisticSet.unitCode},
            ${statisticSet.availabilityStatus},
            ${statisticSet.recordType},
            ${sourceId},
            ${primarySource?.sourceUrl ?? null},
            ${primarySource?.pageReference ?? null},
            ${statisticSet.verificationStatus},
            ${statisticSet.publicationStatus},
            ${statisticSet.notes}
          )
          ON CONFLICT (
            commodity_id,
            statistic_year,
            metric_code,
            basis_code,
            record_type
          ) DO UPDATE SET
            unit_code = EXCLUDED.unit_code,
            availability_status = EXCLUDED.availability_status,
            source_id = EXCLUDED.source_id,
            source_url = EXCLUDED.source_url,
            page_reference = EXCLUDED.page_reference,
            verification_status = EXCLUDED.verification_status,
            publication_status = EXCLUDED.publication_status,
            notes = EXCLUDED.notes,
            updated_at = NOW()
          RETURNING id::text AS id;
        `;
        const key = createGlobalStatisticSetKey(
          data.commoditySlug,
          statisticSet.statisticYear,
          statisticSet.metricCode,
          statisticSet.basisCode,
          statisticSet.recordType,
        );

        this.globalStatisticSetIdByKey.set(key, row.id);
        processed += 1;
      }
    }

    return processed;
  }

  private async prepareGlobalEntryRanks(
    statisticSetId: string,
    expectedCountryIds: Set<string>,
  ) {
    const existingEntries = await this.transaction<ExistingEntryRow[]>`
      SELECT country_region_id::text AS "countryRegionId"
      FROM public.commodity_global_statistic_entries
      WHERE statistic_set_id = ${statisticSetId};
    `;
    const staleEntry = existingEntries.find(
      (entry) => !expectedCountryIds.has(entry.countryRegionId),
    );

    if (staleEntry) {
      throw new Error(
        "Global statistic set memiliki country entry di luar staging. " +
          "Sinkronisasi tersebut memerlukan delete dan sengaja diblokir.",
      );
    }

    if (existingEntries.length > 0 && expectedCountryIds.size === 0) {
      throw new Error(
        "Global statistic set tidak boleh diubah menjadi tanpa entry karena " +
          "memerlukan delete.",
      );
    }

    for (const entry of existingEntries) {
      await this.transaction`
        UPDATE public.commodity_global_statistic_entries
        SET rank = rank + 1000, updated_at = NOW()
        WHERE statistic_set_id = ${statisticSetId}
          AND country_region_id = ${entry.countryRegionId};
      `;
    }
  }

  private async upsertGlobalStatisticEntries(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      for (const statisticSet of data.globalStatisticSets) {
        const statisticSetKey = createGlobalStatisticSetKey(
          data.commoditySlug,
          statisticSet.statisticYear,
          statisticSet.metricCode,
          statisticSet.basisCode,
          statisticSet.recordType,
        );
        const statisticSetId = requireId(
          this.globalStatisticSetIdByKey,
          statisticSetKey,
          "Global statistic set",
        );
        const expectedCountryIds = new Set(
          statisticSet.entries.map((entry) =>
            requireId(
              this.regionIdBySlug,
              entry.countryRegionSlug,
              "Country region",
            ),
          ),
        );

        await this.prepareGlobalEntryRanks(
          statisticSetId,
          expectedCountryIds,
        );

        for (const entry of statisticSet.entries) {
          const countryRegionId = requireId(
            this.regionIdBySlug,
            entry.countryRegionSlug,
            "Country region",
          );

          await this.transaction`
            INSERT INTO public.commodity_global_statistic_entries (
              statistic_set_id,
              country_region_id,
              rank,
              value,
              notes
            ) VALUES (
              ${statisticSetId},
              ${countryRegionId},
              ${entry.rank},
              ${entry.value},
              ${entry.notes ?? null}
            )
            ON CONFLICT (statistic_set_id, country_region_id) DO UPDATE SET
              rank = EXCLUDED.rank,
              value = EXCLUDED.value,
              notes = EXCLUDED.notes,
              updated_at = NOW();
          `;

          processed += 1;
        }
      }
    }

    return processed;
  }

  private async upsertGlobalStatisticSetSources(
    validatedImport: ValidatedCommodityImport,
  ) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      for (const statisticSet of data.globalStatisticSets) {
        const statisticSetKey = createGlobalStatisticSetKey(
          data.commoditySlug,
          statisticSet.statisticYear,
          statisticSet.metricCode,
          statisticSet.basisCode,
          statisticSet.recordType,
        );
        const statisticSetId = requireId(
          this.globalStatisticSetIdByKey,
          statisticSetKey,
          "Global statistic set",
        );

        for (const source of statisticSet.supportingSources) {
          const sourceId = requireId(
            this.sourceIdBySlug,
            source.sourceSlug,
            "Source",
          );

          await this.transaction`
            INSERT INTO public.commodity_global_statistic_set_sources (
              statistic_set_id,
              source_id,
              source_role,
              citation_label,
              source_url,
              page_reference
            ) VALUES (
              ${statisticSetId},
              ${sourceId},
              ${source.sourceRole},
              ${source.citationLabel ?? null},
              ${source.sourceUrl ?? null},
              ${source.pageReference ?? null}
            )
            ON CONFLICT (
              statistic_set_id,
              source_id,
              source_role,
              COALESCE(citation_label, ''),
              COALESCE(page_reference, '')
            ) DO UPDATE SET
              source_url = EXCLUDED.source_url,
              updated_at = NOW();
          `;

          processed += 1;
        }
      }
    }

    return processed;
  }

  private async upsertProducers(validatedImport: ValidatedCommodityImport) {
    let processed = 0;

    for (const { data } of validatedImport.commodityFiles) {
      const commodityId = requireId(
        this.commodityIdBySlug,
        data.commoditySlug,
        "Commodity",
      );

      for (const producer of data.producers) {
        const sourceId = requireId(
          this.sourceIdBySlug,
          producer.primarySource.sourceSlug,
          "Source",
        );
        const industryCompanyId = producer.industryCompanySlug
          ? requireId(
              this.industryCompanyIdBySlug,
              producer.industryCompanySlug,
              "Industry company",
            )
          : null;
        const primaryRegionId = producer.primaryRegionSlug
          ? requireId(
              this.regionIdBySlug,
              producer.primaryRegionSlug,
              "Primary region",
            )
          : null;

        await this.transaction`
          INSERT INTO public.commodity_producers (
            commodity_id,
            industry_company_id,
            producer_key,
            company_name,
            operation_area,
            primary_region_id,
            producer_role,
            display_order,
            source_id,
            source_url,
            page_reference,
            is_active,
            verification_status,
            publication_status,
            notes
          ) VALUES (
            ${commodityId},
            ${industryCompanyId},
            ${producer.producerKey},
            ${producer.companyName},
            ${producer.operationArea},
            ${primaryRegionId},
            ${producer.producerRole},
            ${producer.displayOrder},
            ${sourceId},
            ${producer.primarySource.sourceUrl},
            ${producer.primarySource.pageReference ?? null},
            ${producer.isActive},
            ${producer.verificationStatus},
            ${producer.publicationStatus},
            ${producer.notes}
          )
          ON CONFLICT (commodity_id, producer_key) DO UPDATE SET
            industry_company_id = EXCLUDED.industry_company_id,
            company_name = EXCLUDED.company_name,
            operation_area = EXCLUDED.operation_area,
            primary_region_id = EXCLUDED.primary_region_id,
            producer_role = EXCLUDED.producer_role,
            display_order = EXCLUDED.display_order,
            source_id = EXCLUDED.source_id,
            source_url = EXCLUDED.source_url,
            page_reference = EXCLUDED.page_reference,
            is_active = EXCLUDED.is_active,
            verification_status = EXCLUDED.verification_status,
            publication_status = EXCLUDED.publication_status,
            notes = EXCLUDED.notes,
            updated_at = NOW();
        `;

        processed += 1;
      }
    }

    return processed;
  }
}

function printPreflightFailure(
  preflight: ReturnType<typeof evaluateCommodityPreflight>,
) {
  console.error("\nDatabase preflight gagal:");

  for (const issue of preflight.issues) {
    console.error(`- [${issue.category}] ${issue.key}: ${issue.message}`);
  }
}

async function runTransaction(validatedImport: ValidatedCommodityImport) {
  return sqlClient.begin(async (transaction) => {
    await transaction`
      SELECT pg_advisory_xact_lock(
        hashtext('minevision:commodity-import:v1')
      );
    `;

    const preflightState = await readPreflightState(transaction);
    const preflight = evaluateCommodityPreflight(
      collectCommodityPreflightRequirements(validatedImport),
      preflightState,
    );

    if (!preflight.passed) {
      printPreflightFailure(preflight);
      throw new Error("Import dihentikan karena database preflight gagal.");
    }

    const writer = new PostgresCommodityImportWriter(transaction);
    await writer.initializeReferenceMaps();

    return executeCommodityImportSteps(
      validatedImport,
      async (table: CommodityImportTable, dataset) => {
        const processed = await writer.writeStep(table, dataset);
        console.log(
          `[TX] ${table.padEnd(49)} ${String(processed).padStart(4)} record`,
        );
        return processed;
      },
    );
  });
}

async function main() {
  const arguments_ = process.argv.slice(2);
  assertCommodityApplyFlag(arguments_);

  const unknownFlag = arguments_.find(
    (argument) => argument.startsWith("--") && argument !== "--apply",
  );

  if (unknownFlag) {
    throw new Error(`Flag tidak dikenal: ${unknownFlag}`);
  }

  const inputArgument = arguments_.find(
    (argument) => !argument.startsWith("--"),
  );

  if (!inputArgument) {
    throw new Error(
      "Lokasi manifest wajib diberikan. Contoh: " +
        "npm run data:import:commodity -- " +
        "data/staging/commodity/manifest.json --apply",
    );
  }

  const validatedImport = await loadValidatedImport(inputArgument);

  if (!validatedImport) {
    process.exitCode = 1;
    return;
  }

  console.log("\nPERINGATAN: --apply aktif. Database akan diperbarui.");
  console.log("Menjalankan preflight ulang di dalam transaction...");

  const summary = await runTransaction(validatedImport);

  console.log("\nImport Commodity berhasil dan transaction telah di-commit.");
  console.log(`Tabel diproses : ${summary.tables.length}`);
  console.log(`Total upsert   : ${summary.totalProcessed}`);
  console.log("Delete         : 0");
}

main()
  .catch((error: unknown) => {
    console.error("\nCommodity import gagal:", getErrorMessage(error));
    console.error("Transaction dibatalkan; perubahan di-rollback.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
