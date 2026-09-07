import { config } from "dotenv";
import postgres from "postgres";
import { createCareerDryRunPlan } from "../../src/features/data-ingestion/services/dry-run-career-import";
import { assertCareerCommitFlag, executeCareerImport } from "../../src/features/data-ingestion/services/import-career";
import { careerPostgresCode, getCareerImportDiagnostic } from "../../src/features/data-ingestion/services/career-import-diagnostics";
import { evaluateCareerVerification } from "../../src/features/data-ingestion/services/verify-career-import";
import { careerFingerprint, readCareerSnapshot, withCareerReadOnly } from "./database";
import { loadValidatedCareerImport } from "./load-career-import";

type CareerMode = "preflight" | "dry-run" | "import" | "verify";

export function formatCareerDatabaseFailure(mode: CareerMode, error: unknown): string {
  const diagnostic = getCareerImportDiagnostic(error);
  const postgresCode = careerPostgresCode(error);
  return JSON.stringify({ mode, outcome: "failed", commitConfirmed: false,
    diagnostic: diagnostic ?? { errorId: "CAREER_DATABASE_FAILED", ...(postgresCode ? { postgresCode } : {}) } });
}
export function parseCareerArguments(mode: CareerMode, args: readonly string[]) {
  if (mode === "import") assertCareerCommitFlag(args);
  if (args.some((arg) => arg.startsWith("--") && !(mode === "import" && arg === "--commit")))
    throw new Error("Flag Career tidak dikenal.");
  const paths = args.filter((arg) => !arg.startsWith("--"));
  if (paths.length !== 1) throw new Error("Berikan tepat satu manifest path Career.");
  return paths[0];
}

export async function runCareerCli(mode: CareerMode, args = process.argv.slice(2)) {
  let client: postgres.Sql<Record<string, never>> | undefined;
  let databasePhase = false;
  const statements: string[] = [];
  try {
    const manifestPath = parseCareerArguments(mode, args);
    const dataset = await loadValidatedCareerImport(manifestPath);
    if (!dataset) { process.exitCode = 1; return; }
    config({ path: ".env.local", quiet: true });
    const databaseUrl = process.env.DATABASE_MIGRATION_URL;
    if (!databaseUrl) throw new Error("DATABASE_MIGRATION_URL tidak tersedia.");
    databasePhase = true;
    client = postgres(databaseUrl, { ssl: "require", max: 1, prepare: false,
      connect_timeout: 10, idle_timeout: 20,
      // Record only the SQL verb; parameters and connection details are never logged.
      debug: (_connection, query) => { statements.push(query.trim().split(/\s+/)[0].toUpperCase()); },
      onnotice: () => {},
    });
    if (mode === "import") {
      const { createPostgresCareerDatabase } = await import("./writer");
      const report = await executeCareerImport(dataset, createPostgresCareerDatabase(client, dataset),
        (progress) => console.log(JSON.stringify({ mode, transaction: "pending", ...progress })));
      console.log(JSON.stringify({ mode, transaction: "committed", ...report }, null, 2));
      return;
    }
    const result = await withCareerReadOnly(client, async (sql) => {
      const before = await readCareerSnapshot(sql, dataset);
      const report = mode === "verify" ? evaluateCareerVerification(dataset, before) :
        createCareerDryRunPlan(dataset, before);
      const after = await readCareerSnapshot(sql, dataset);
      const beforeFingerprint = careerFingerprint(before);
      const afterFingerprint = careerFingerprint(after);
      if (beforeFingerprint !== afterFingerprint) throw new Error("Career fingerprint changed");
      return { report, beforeFingerprint, afterFingerprint };
    });
    const allowed = new Set(["SELECT", "BEGIN", "ROLLBACK"]);
    const nonReadStatements = statements.filter((verb) => !allowed.has(verb));
    if (nonReadStatements.length) throw new Error("Career read-only SQL audit failed");
    const report = { ...result.value.report, tables: result.value.report.tables.map((table) => {
      if ("records" in table) {
        return { table: table.table, expected: table.expected, inserts: table.inserts,
          updates: table.updates, unchanged: table.unchanged };
      }
      return table;
    }) };
    console.log(JSON.stringify({ mode, ...report, proof: { ...result.proof,
      statementCounts: Object.fromEntries([...new Set(statements)].map((verb) =>
        [verb, statements.filter((statement) => statement === verb).length])),
      writeStatements: nonReadStatements.length,
      beforeFingerprint: result.value.beforeFingerprint, afterFingerprint: result.value.afterFingerprint } }, null, 2));
    if (!report.passed) process.exitCode = 1;
  } catch (error) {
    // Never print or serialize the database error itself, including its message.
    console.error(databasePhase ? formatCareerDatabaseFailure(mode, error) :
      error instanceof Error ? error.message : "Career CLI gagal.");
    process.exitCode = 1;
  } finally {
    if (client) {
      try { await client.end({ timeout: 5 }); }
      catch { console.error("Career database connection cleanup failed."); process.exitCode = 1; }
    }
  }
}
