import { describe, expect, it } from "vitest";
import { CareerImportExecutionError, careerPostgresCode, getCareerImportDiagnostic,
  type CareerBatchProgress, type CareerImportDiagnostic } from "./career-import-diagnostics";
import { executeCareerImport, type CareerImportDatabase } from "./import-career";
import { careerFixture, careerSnapshot, memoryCareerDatabase } from "./career-import-test-helpers";
import { CAREER_IMPORT_TABLES, type CareerSnapshot } from "./career-import-model";
import { formatCareerDatabaseFailure } from "../../../../scripts/career/cli";

const dataset = careerFixture();
const sensitive = "postgres://test-user:test-password@database.invalid/db https://source.invalid/private INSERT INTO private VALUES ($1) secret-slug staged-content";
const driverError = (code: string) => Object.assign(new Error(sensitive), {
  code, detail: sensitive, query: sensitive, parameters: [sensitive], cause: new Error(sensitive),
});
async function failure(work: Promise<unknown>) {
  try { await work; } catch (error) {
    expect(error).toBeInstanceOf(CareerImportExecutionError);
    return getCareerImportDiagnostic(error)!;
  }
  throw new Error("Expected a typed import failure");
}

describe("Career execution diagnostics", () => {
  it("reports safe context for a later failed batch and rolls back all prior writes", async () => {
    const db = memoryCareerDatabase(); const progress: CareerBatchProgress[] = [];
    let writes = 0;
    const database: CareerImportDatabase = { transaction: (work) => db.database.transaction((tx) => work({
      ...tx, writeBatch: async (table, rows) => {
        if (++writes === 6) throw driverError("23503");
        return tx.writeBatch(table, rows);
      },
    })) };
    const diagnostic = await failure(executeCareerImport(dataset, database, (event) => progress.push(event)));
    expect(diagnostic).toEqual({ phase: "write_batch", table: "career_professions", batchIndex: 2,
      totalBatches: 9, batchRowCount: 300, errorId: "CAREER_BATCH_WRITE_FAILED", postgresCode: "23503" });
    expect(progress.filter((event) => event.eventId === "CAREER_BATCH_COMPLETED")).toHaveLength(5);
    expect(progress.at(-1)).toEqual({ phase: "write_batch", table: "career_professions", batchIndex: 2,
      totalBatches: 9, batchRowCount: 300, eventId: "CAREER_BATCH_STARTED" });
    expect(db.rollbacks()).toBe(1); expect(db.snapshot()).toEqual(careerSnapshot());
    expect(JSON.stringify({ diagnostic, progress }).includes(sensitive)).toBe(false);
  });

  it("reports every successful batch including partial final batches, and none for an unchanged rerun", async () => {
    const db = memoryCareerDatabase(); const progress: CareerBatchProgress[] = [];
    await executeCareerImport(dataset, db.database, (event) => progress.push(event));
    for (const table of CAREER_IMPORT_TABLES) {
      const writes = db.writes.filter((batch) => batch.table === table);
      const events = progress.filter((event) => event.table === table);
      expect(events).toEqual(writes.flatMap((batch, index) => ["CAREER_BATCH_STARTED", "CAREER_BATCH_COMPLETED"].map((eventId) => ({
        phase: "write_batch", table, batchIndex: index + 1, totalBatches: writes.length, batchRowCount: batch.count, eventId,
      }))));
    }
    expect(progress.at(-1)?.batchRowCount).toBe(275);
    const count = progress.length;
    const second = await executeCareerImport(dataset, db.database, (event) => progress.push(event));
    expect(progress).toHaveLength(count); expect(second.totalInserts + second.totalUpdates).toBe(0);
  });

  it("reports expected and returned row counts and rolls back on count mismatch", async () => {
    const db = memoryCareerDatabase();
    const database: CareerImportDatabase = { transaction: (work) => db.database.transaction((tx) => work({
      ...tx, writeBatch: async (table, rows) => { await tx.writeBatch(table, rows); return rows.length - 1; },
    })) };
    expect(await failure(executeCareerImport(dataset, database))).toEqual({
      phase: "write_batch", table: "sources", batchIndex: 1, totalBatches: 1, batchRowCount: 166,
      errorId: "CAREER_BATCH_ROW_COUNT_MISMATCH", expectedRowCount: 166, returnedRowCount: 165,
    });
    expect(db.rollbacks()).toBe(1); expect(db.snapshot()).toEqual(careerSnapshot());
  });

  it("reports only affected tables, residual plan counts and distinct field names after verification failure", async () => {
    const db = memoryCareerDatabase(); let reads = 0;
    const database: CareerImportDatabase = { transaction: (work) => db.database.transaction((tx) => work({
      ...tx, readSnapshot: async () => {
        const snapshot = await tx.readSnapshot();
        if (++reads === 2) {
          snapshot.rows.career_professions.pop();
          for (const row of snapshot.rows.contents.slice(0, 2)) {
            row.values.title = sensitive; row.values.body = sensitive;
          }
          snapshot.rows.contents[0].values.metadata = { [sensitive]: sensitive };
        }
        return snapshot;
      },
    })) };
    const diagnostic = await failure(executeCareerImport(dataset, database));
    expect(diagnostic).toEqual({ phase: "post_write_verification", errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED", tables: [
      { table: "contents", inserts: 0, updates: 2, unchanged: 11, mismatchedFields: ["body", "metadata", "title"] },
      { table: "career_professions", inserts: 1, updates: 0, unchanged: 2476, mismatchedFields: [] },
    ] });
    expect(db.rollbacks()).toBe(1); expect(db.snapshot()).toEqual(careerSnapshot());
  });

  it("identifies a duplicate's affected table without exposing its natural key", async () => {
    const db = memoryCareerDatabase(); let reads = 0;
    const database: CareerImportDatabase = { transaction: (work) => db.database.transaction((tx) => work({
      ...tx, readSnapshot: async () => {
        const snapshot = await tx.readSnapshot();
        if (++reads === 2) snapshot.rows.career_profile_items.push(snapshot.rows.career_profile_items[0]);
        return snapshot;
      },
    })) };
    expect(await failure(executeCareerImport(dataset, database))).toEqual({
      phase: "post_write_verification", errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED", tables: [
        { table: "career_profile_items", inserts: 0, updates: 0, unchanged: 2675, mismatchedFields: [] },
      ],
    });
    expect(db.rollbacks()).toBe(1);
  });

  it("redacts preflight issue details before any write", async () => {
    const snapshot = careerSnapshot(); snapshot.referenceIssues.push(sensitive);
    const db = memoryCareerDatabase(snapshot);
    expect(await failure(executeCareerImport(dataset, db.database))).toEqual({ phase: "preflight", errorId: "CAREER_PREFLIGHT_FAILED" });
    expect(db.writes).toHaveLength(0); expect(db.rollbacks()).toBe(1);
  });

  it.each([1, 2])("redacts snapshot read failures at read %i", async (failedRead) => {
    let reads = 0;
    const database: CareerImportDatabase = { transaction: async (work) => work({
      readSnapshot: async (): Promise<CareerSnapshot> => {
        if (++reads === failedRead) throw driverError("08006");
        return careerSnapshot(dataset);
      }, writeBatch: async () => { throw new Error("Unexpected write"); },
    }) };
    expect(await failure(executeCareerImport(dataset, database))).toEqual({
      phase: failedRead === 1 ? "preflight" : "post_write_verification",
      errorId: failedRead === 1 ? "CAREER_PREFLIGHT_FAILED" : "CAREER_POST_WRITE_CHECK_FAILED", postgresCode: "08006",
    });
  });

  it.each(["begin", "commit"])("wraps %s failure without assuming commit status", async (stage) => {
    const database: CareerImportDatabase = { transaction: async (work) => {
      if (stage === "commit") await work({ readSnapshot: async () => careerSnapshot(dataset), writeBatch: async () => 0 });
      throw driverError("40001");
    } };
    expect(await failure(executeCareerImport(dataset, database))).toEqual({
      phase: "transaction", errorId: "CAREER_TRANSACTION_FAILED", postgresCode: "40001",
    });
  });

  it.each(["SECRET_PASSWORD", "UNDEFINED_VALUE", "ZZZZZ", "23505\n", sensitive, 23505, undefined])(
    "rejects a non-allowlisted driver code (case %#)", (code) => {
      expect(careerPostgresCode({ code })).toBeUndefined();
    });
  it("redacts arbitrary messages, getters, nested causes and lookalike typed errors", () => {
    const errors = [sensitive, driverError("SECRET_PASSWORD"), { get code() { throw new Error(sensitive); } },
      { name: "CareerImportExecutionError", diagnostic: { errorId: sensitive }, cause: { code: "23505" } }];
    for (const error of errors) {
      expect(JSON.parse(formatCareerDatabaseFailure("import", error))).toEqual({
        mode: "import", outcome: "failed", commitConfirmed: false, diagnostic: { errorId: "CAREER_DATABASE_FAILED" },
      });
    }
  });
  it("prints only the allowlisted code for an unknown database error", () => {
    expect(JSON.parse(formatCareerDatabaseFailure("import", driverError("23505")))).toEqual({
      mode: "import", outcome: "failed", commitConfirmed: false,
      diagnostic: { errorId: "CAREER_DATABASE_FAILED", postgresCode: "23505" },
    });
  });
  it("reads an untrusted code accessor once before validating the captured value", () => {
    let reads = 0;
    const error = { get code() { return ++reads === 1 ? "23505" : sensitive; } };
    const output = JSON.parse(formatCareerDatabaseFailure("import", error));
    expect(reads).toBe(1);
    expect(output.diagnostic).toEqual({ errorId: "CAREER_DATABASE_FAILED", postgresCode: "23505" });
  });
  it("projects typed diagnostics, strips injected fields and keeps snapshots immutable", () => {
    const input = { phase: "post_write_verification", errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED",
      tables: [{ table: "contents", inserts: 0, updates: 1, unchanged: 12,
        mismatchedFields: ["title", sensitive, "title"], key: sensitive, values: sensitive }],
      message: sensitive, parameters: [sensitive], postgresCode: "SECRET_PASSWORD",
    } as unknown as CareerImportDiagnostic; // Deliberately simulate an untrusted runtime payload.
    const error = new CareerImportExecutionError(input);
    Object.assign(error, { message: sensitive, cause: driverError("23505"), code: sensitive, url: sensitive });
    if (input.errorId === "CAREER_POST_WRITE_VERIFICATION_FAILED") input.tables[0].mismatchedFields.push("body");
    const copy = getCareerImportDiagnostic(error)!;
    if (copy.errorId === "CAREER_POST_WRITE_VERIFICATION_FAILED") copy.tables[0].mismatchedFields.push("body");
    const output = formatCareerDatabaseFailure("import", error);
    expect(JSON.parse(output)).toEqual({ mode: "import", outcome: "failed", commitConfirmed: false, diagnostic: {
      phase: "post_write_verification", errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED",
      tables: [{ table: "contents", inserts: 0, updates: 1, unchanged: 12, mismatchedFields: ["title"] }],
    } });
    for (const token of sensitive.split(" ")) expect(output.includes(token)).toBe(false);
    expect(getCareerImportDiagnostic(new Error(sensitive))).toBeUndefined();
  });
});
