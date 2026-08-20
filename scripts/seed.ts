import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { NewMeasurementUnit, NewSource } from "../src/db/schema";
import { measurementUnits, sources } from "../src/db/schema";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_MIGRATION_URL wajib tersedia untuk menjalankan seed.",
  );
}

if (
  !databaseUrl.startsWith("postgresql://") &&
  !databaseUrl.startsWith("postgres://")
) {
  throw new Error(
    "DATABASE_MIGRATION_URL harus menggunakan protokol PostgreSQL.",
  );
}

const postgresClient = postgres(databaseUrl, {
  prepare: false,
  max: 1,
  ssl: "require",
  connect_timeout: 10,
  idle_timeout: 20,
});

const database = drizzle(postgresClient);

const sourceSeed: NewSource[] = [
  {
    name: "Kementerian Energi dan Sumber Daya Mineral",
    slug: "kementerian-esdm",
    type: "government",
    organization:
      "Kementerian Energi dan Sumber Daya Mineral Republik Indonesia",
    url: "https://www.esdm.go.id/",
    description:
      "Sumber resmi pemerintah untuk data, kebijakan, dan publikasi sektor energi dan sumber daya mineral Indonesia.",
    isOfficial: true,
    verificationStatus: "verified",
    verifiedAt: new Date(),
    isActive: true,
  },
  {
    name: "Badan Pusat Statistik",
    slug: "badan-pusat-statistik",
    type: "statistics_agency",
    organization: "Badan Pusat Statistik Republik Indonesia",
    url: "https://www.bps.go.id/id",
    description:
      "Sumber resmi statistik nasional Indonesia, termasuk data ekonomi, ekspor, investasi, dan produk domestik bruto.",
    isOfficial: true,
    verificationStatus: "verified",
    verifiedAt: new Date(),
    isActive: true,
  },
];

const measurementUnitSeed: NewMeasurementUnit[] = [
  {
    code: "metric_ton",
    name: "Metric Ton",
    symbol: "t",
    category: "mass",
    description: "Satuan massa setara dengan 1.000 kilogram.",
    isActive: true,
  },
  {
    code: "dry_metric_ton",
    name: "Dry Metric Ton",
    symbol: "dmt",
    category: "mass",
    description: "Satuan massa material dalam kondisi kering.",
    isActive: true,
  },
  {
    code: "kilogram",
    name: "Kilogram",
    symbol: "kg",
    category: "mass",
    description: "Satuan massa dalam Sistem Internasional.",
    isActive: true,
  },
  {
    code: "gram",
    name: "Gram",
    symbol: "g",
    category: "mass",
    description: "Satuan massa setara dengan 0,001 kilogram.",
    isActive: true,
  },
  {
    code: "troy_ounce",
    name: "Troy Ounce",
    symbol: "oz t",
    category: "mass",
    description: "Satuan massa yang umum digunakan untuk logam mulia.",
    isActive: true,
  },
  {
    code: "megawatt",
    name: "Megawatt",
    symbol: "MW",
    category: "energy",
    description: "Satuan kapasitas daya yang digunakan dalam data energi.",
    isActive: true,
  },
];

async function seedSources() {
  for (const source of sourceSeed) {
    await database
      .insert(sources)
      .values(source)
      .onConflictDoUpdate({
        target: sources.slug,
        set: {
          name: source.name,
          type: source.type,
          organization: source.organization,
          url: source.url,
          description: source.description,
          isOfficial: source.isOfficial,
          verificationStatus: source.verificationStatus,
          verifiedAt: source.verifiedAt,
          isActive: source.isActive,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Sources seed selesai: ${sourceSeed.length} record.`);
}

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

async function runSeed() {
  console.log("Menjalankan seed MineVision Development...");

  await database.transaction(async () => {
    await seedSources();
    await seedMeasurementUnits();
  });

  console.log("Seed MineVision Development berhasil.");
}

try {
  await runSeed();
} catch (error) {
  console.error("Seed MineVision Development gagal:", error);

  process.exitCode = 1;
} finally {
  await postgresClient.end();
}
