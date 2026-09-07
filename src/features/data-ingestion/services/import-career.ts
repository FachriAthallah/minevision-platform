import { CAREER_IMPORT_TABLES, careerMismatchedFields, scopeCareerRows,
  type CareerImportTable, type CareerSnapshot } from "./career-import-model";
import { createCareerDryRunPlan, type CareerPlannedRow } from "./dry-run-career-import";
import { CareerImportExecutionError, careerPostgresCode, getCareerImportDiagnostic,
  type CareerBatchContext, type CareerBatchProgress } from "./career-import-diagnostics";
import type { ValidatedCareerImport } from "./validate-career-import";

export const CAREER_BATCH_SIZE = 300;
export function chunkCareerRecords<T>(rows: readonly T[], columns: number, size = CAREER_BATCH_SIZE): T[][] {
  if (!Number.isInteger(columns) || columns < 1 || columns > 60_000 || !Number.isInteger(size) || size < 1)
    throw new Error("Invalid Career batch dimensions");
  const limit = Math.min(size, CAREER_BATCH_SIZE, Math.floor(60_000 / columns));
  const batches: T[][] = [];
  for (let index = 0; index < rows.length; index += limit) batches.push(rows.slice(index, index + limit));
  return batches;
}
export function assertCareerCommitFlag(args: readonly string[]) {
  if (!args.includes("--commit")) throw new Error(
    "Import ditolak: flag --commit wajib. Jalankan npm run data:dry-run:career -- data/staging/career/manifest.json terlebih dahulu.");
}
export interface CareerImportTransaction {
  readSnapshot(): Promise<CareerSnapshot>;
  writeBatch(table: CareerImportTable, rows: CareerPlannedRow[]): Promise<number>;
}
export interface CareerImportDatabase {
  transaction<T>(work: (transaction: CareerImportTransaction) => Promise<T>): Promise<T>;
}
export async function executeCareerImport(dataset: ValidatedCareerImport, database: CareerImportDatabase,
  onBatch?: (progress: CareerBatchProgress) => void) {
  const execution: { phase: "transaction" | "preflight" | "post_write_verification" } = { phase: "transaction" };
  try {
    return await database.transaction(async (transaction) => {
      execution.phase = "preflight";
      const plan = createCareerDryRunPlan(dataset, await transaction.readSnapshot());
      if (!plan.passed) throw new CareerImportExecutionError({ phase: "preflight", errorId: "CAREER_PREFLIGHT_FAILED" });
      for (const table of CAREER_IMPORT_TABLES) {
        const planned = plan.tables.find((entry) => entry.table === table)!;
        const changes = planned.records.filter((row) => row.action !== "unchanged");
        const columnCount = changes[0] ? Object.keys(changes[0].values).length + 2 : 1;
        const batches = chunkCareerRecords(changes, columnCount);
        for (const [index, batch] of batches.entries()) {
          const context: CareerBatchContext = { phase: "write_batch", table, batchIndex: index + 1,
            totalBatches: batches.length, batchRowCount: batch.length };
          onBatch?.({ ...context, eventId: "CAREER_BATCH_STARTED" });
          let returnedRowCount: number;
          try { returnedRowCount = await transaction.writeBatch(table, batch); }
          catch (error) {
            throw new CareerImportExecutionError({ ...context, errorId: "CAREER_BATCH_WRITE_FAILED",
              postgresCode: careerPostgresCode(error) });
          }
          if (returnedRowCount !== batch.length)
            throw new CareerImportExecutionError({ ...context, errorId: "CAREER_BATCH_ROW_COUNT_MISMATCH",
              expectedRowCount: batch.length, returnedRowCount });
          onBatch?.({ ...context, eventId: "CAREER_BATCH_COMPLETED" });
        }
      }
      // Re-read within the same transaction. Any mismatch also rolls back parents
      // and all earlier batches, including updates to shared sources.
      execution.phase = "post_write_verification";
      const snapshot = await transaction.readSnapshot();
      const after = createCareerDryRunPlan(dataset, snapshot);
      if (!after.passed || after.totalInserts || after.totalUpdates) {
        const actual = scopeCareerRows(dataset, snapshot.rows);
        const tables = after.tables.flatMap(({ table, inserts, updates, unchanged, records }) => {
          const existing = new Map(actual[table].map((row) => [row.key, row]));
          const mismatchedFields = records.flatMap((row) => {
            const prior = existing.get(row.key);
            return prior ? careerMismatchedFields(row, prior) : [];
          });
          return inserts || updates || existing.size !== actual[table].length
            ? [{ table, inserts, updates, unchanged, mismatchedFields }] : [];
        });
        throw new CareerImportExecutionError({ phase: "post_write_verification", errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED", tables });
      }
      execution.phase = "transaction"; // Includes failures during COMMIT after this callback returns.
      return { ...plan, tables: plan.tables.map(({ table, expected, inserts, updates, unchanged }) =>
        ({ table, expected, inserts, updates, unchanged })) };
    });
  } catch (error) {
    if (getCareerImportDiagnostic(error)) throw error;
    const { phase } = execution;
    const postgresCode = careerPostgresCode(error);
    if (phase === "preflight") throw new CareerImportExecutionError({ phase, errorId: "CAREER_PREFLIGHT_FAILED", postgresCode });
    if (phase === "post_write_verification")
      throw new CareerImportExecutionError({ phase, errorId: "CAREER_POST_WRITE_CHECK_FAILED", postgresCode });
    throw new CareerImportExecutionError({ phase, errorId: "CAREER_TRANSACTION_FAILED", postgresCode });
  }
}
