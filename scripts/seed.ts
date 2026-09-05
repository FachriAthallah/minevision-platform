import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  commodities,
  commodityPriceStandards,
  measurementUnits,
  regions,
  sources,
} from "../src/db/schema";

import type { NewMeasurementUnit, NewSource } from "../src/db/schema";

import { commoditySeed } from "./data/commodities";
import { priceStandardSeed } from "./data/price-standards";
import { regionSeed } from "./data/regions";

/*
|--------------------------------------------------------------------------
| Environment
|--------------------------------------------------------------------------
*/

config({
  path: ".env.local",
});

const dataurl = process.env.DATABASE_MIGRATION_URL;

if (!dataurl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.");
}

/*
|--------------------------------------------------------------------------
| Database connection
|--------------------------------------------------------------------------
*/

const sqlClient = postgres(dataurl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

const database = drizzle(sqlClient);

/*
|--------------------------------------------------------------------------
| Sources master data
|--------------------------------------------------------------------------
*/

const sourceSeed: NewSource[] = [
  {
    name: "Kementerian Energi dan Sumber Daya Mineral",
    slug: "kementerian-esdm",
    organization:
      "Kementerian Energi dan Sumber Daya Mineral Republik Indonesia",
    type: "government",
    url: "https://www.esdm.go.id/",
    description:
      "Sumber resmi pemerintah Indonesia untuk data energi, mineral, dan batubara.",
    isOfficial: true,
    verificationStatus: "verified",
    verifiedAt: new Date(),
    isActive: true,
  },
  {
    name: "Badan Pusat Statistik",
    slug: "bps",
    organization: "Badan Pusat Statistik Republik Indonesia",
    type: "statistics_agency",
    url: "https://www.bps.go.id/id",
    description:
      "Sumber statistik resmi Indonesia untuk data ekonomi, industri, perdagangan, dan kependudukan.",
    isOfficial: true,
    verificationStatus: "verified",
    verifiedAt: new Date(),
    isActive: true,
  },
  {
    name: "Logam Mulia ANTAM",
    slug: "logam-mulia-antam",
    organization: "PT Aneka Tambang Tbk",
    type: "market_data",
    url: "https://www.logammulia.com/",
    description:
      "Sumber resmi informasi dan harga emas batangan ritel Logam Mulia ANTAM.",
    isOfficial: true,
    verificationStatus: "verified",
    verifiedAt: new Date(),
    isActive: true,
  },
];

/*
|--------------------------------------------------------------------------
| Measurement units master data
|--------------------------------------------------------------------------
*/

const measurementUnitSeed: NewMeasurementUnit[] = [
  {
    name: "Metric Ton",
    code: "metric_ton",
    symbol: "t",
    category: "mass",
    description: "Satuan massa setara dengan 1.000 kilogram.",
    isActive: true,
  },
  {
    name: "Dry Metric Ton",
    code: "dry_metric_ton",
    symbol: "dmt",
    category: "mass",
    description:
      "Satuan metrik ton berdasarkan berat material dalam kondisi kering.",
    isActive: true,
  },
  {
    name: "Wet Metric Ton",
    code: "wet_metric_ton",
    symbol: "wmt",
    category: "mass",
    description:
      "Satuan metrik ton berdasarkan berat material dalam kondisi basah.",
    isActive: true,
  },
  {
    name: "Kilogram",
    code: "kilogram",
    symbol: "kg",
    category: "mass",
    description: "Satuan massa kilogram.",
    isActive: true,
  },
  {
    name: "Gram",
    code: "gram",
    symbol: "g",
    category: "mass",
    description: "Satuan massa gram.",
    isActive: true,
  },
  {
    name: "Troy Ounce",
    code: "troy_ounce",
    symbol: "oz t",
    category: "mass",
    description:
      "Satuan massa yang umum digunakan dalam perdagangan logam mulia.",
    isActive: true,
  },
  {
    name: "Pound",
    code: "pound",
    symbol: "lb",
    category: "mass",
    description: "Satuan massa avoirdupois setara dengan 0,45359237 kilogram.",
    isActive: true,
  },
  {
    name: "Megawatt",
    code: "megawatt",
    symbol: "MW",
    category: "energy",
    description:
      "Satuan daya yang digunakan untuk kapasitas pembangkit energi.",
    isActive: true,
  },
  {
    name: "Count",
    code: "count",
    symbol: "unit",
    category: "count",
    description: "Satuan hitungan untuk jumlah entitas atau wilayah kerja.",
    isActive: true,
  },
];

/*
|--------------------------------------------------------------------------
| Seed sources
|--------------------------------------------------------------------------
*/

async function seedSources() {
  for (const source of sourceSeed) {
    await database
      .insert(sources)
      .values(source)
      .onConflictDoUpdate({
        target: sources.slug,
        set: {
          name: source.name,
          organization: source.organization,
          type: source.type,
          url: source.url,
          description: source.description,
          isOfficial: source.isOfficial,
          verificationStatus: source.verificationStatus,
          isActive: source.isActive,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Sources seed selesai: ${sourceSeed.length} record.`);
}

/*
|--------------------------------------------------------------------------
| Seed measurement units
|--------------------------------------------------------------------------
*/

async function seedMeasurementUnits() {
  for (const unit of measurementUnitSeed) {
    await database
      .insert(measurementUnits)
      .values(unit)
      .onConflictDoUpdate({
        target: measurementUnits.code,
        set: {
          name: unit.name,
          symbol: unit.symbol,
          category: unit.category,
          description: unit.description,
          isActive: unit.isActive,
          updatedAt: new Date(),
        },
      });
  }

  console.log(
    `Measurement units seed selesai: ${measurementUnitSeed.length} record.`,
  );
}

/*
|--------------------------------------------------------------------------
| Seed commodities
|--------------------------------------------------------------------------
*/

async function seedCommodities() {
  for (const commodity of commoditySeed) {
    await database
      .insert(commodities)
      .values(commodity)
      .onConflictDoUpdate({
        target: commodities.slug,
        set: {
          ...commodity,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Commodities seed selesai: ${commoditySeed.length} record.`);
}

/*
|--------------------------------------------------------------------------
| Seed regions
|--------------------------------------------------------------------------
*/

async function seedRegions() {
  for (const region of regionSeed) {
    await database
      .insert(regions)
      .values(region)
      .onConflictDoUpdate({
        target: regions.slug,
        set: {
          ...region,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Regions seed selesai: ${regionSeed.length} record.`);
}

/*
|--------------------------------------------------------------------------
| Seed commodity price standards
|--------------------------------------------------------------------------
*/

async function seedPriceStandards() {
  /*
   * Ambil seluruh source yang sudah tersimpan untuk membuat pemetaan:
   * source slug -> source UUID
   */
  const storedSources = await database
    .select({
      id: sources.id,
      slug: sources.slug,
    })
    .from(sources);

  /*
   * Ambil seluruh komoditas untuk membuat pemetaan:
   * commodity slug -> commodity UUID
   */
  const storedCommodities = await database
    .select({
      id: commodities.id,
      slug: commodities.slug,
    })
    .from(commodities);

  const sourceIdBySlug = new Map(
    storedSources.map((source) => [source.slug, source.id]),
  );

  const commodityIdBySlug = new Map(
    storedCommodities.map((commodity) => [commodity.slug, commodity.id]),
  );

  for (const standard of priceStandardSeed) {
    const commodityId = commodityIdBySlug.get(standard.commoditySlug);

    const issuingSourceId = sourceIdBySlug.get(standard.issuingSourceSlug);

    if (!commodityId) {
      throw new Error(
        `Komoditas dengan slug "${standard.commoditySlug}" tidak ditemukan.`,
      );
    }

    if (!issuingSourceId) {
      throw new Error(
        `Source dengan slug "${standard.issuingSourceSlug}" tidak ditemukan.`,
      );
    }

    await database
      .insert(commodityPriceStandards)
      .values({
        commodityId,
        issuingSourceId,
        code: standard.code,
        name: standard.name,
        description: standard.description,
        methodology: standard.methodology,
        defaultCurrencyCode: standard.defaultCurrencyCode,
        defaultUnitCode: standard.defaultUnitCode,
        isActive: standard.isActive,
      })
      .onConflictDoUpdate({
        target: commodityPriceStandards.code,
        set: {
          commodityId,
          issuingSourceId,
          name: standard.name,
          description: standard.description,
          methodology: standard.methodology,
          defaultCurrencyCode: standard.defaultCurrencyCode,
          defaultUnitCode: standard.defaultUnitCode,
          isActive: standard.isActive,
          updatedAt: new Date(),
        },
      });
  }

  console.log(
    `Price standards seed selesai: ${priceStandardSeed.length} record.`,
  );
}

/*
|--------------------------------------------------------------------------
| Main seed runner
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("Menjalankan seed MineVision Development...");

  try {
    /*
     * Urutan tidak boleh sembarangan.
     * Price standard membutuhkan source dan commodity terlebih dahulu.
     */
    await seedSources();
    await seedMeasurementUnits();
    await seedCommodities();
    await seedRegions();
    await seedPriceStandards();

    console.log("Seed MineVision Development berhasil.");
  } finally {
    await sqlClient.end();
  }
}

/*
|--------------------------------------------------------------------------
| Execute
|--------------------------------------------------------------------------
*/

main().catch((error: unknown) => {
  console.error("Seed MineVision Development gagal:", error);
  process.exitCode = 1;
});
