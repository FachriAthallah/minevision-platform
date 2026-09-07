import { describe, expect, it, vi } from "vitest";
import { assertCareerCommitFlag, chunkCareerRecords, executeCareerImport } from "./import-career";
import { careerFixture, careerSnapshot, memoryCareerDatabase } from "./career-import-test-helpers";
import { createCareerDryRunPlan } from "./dry-run-career-import";
import { PostgresCareerWriter } from "../../../../scripts/career/writer";
import type { CareerSql } from "../../../../scripts/career/database";
import * as careerDatabase from "../../../../scripts/career/database";
import { CAREER_IMPORT_TABLES } from "./career-import-model";
import { createPostgresCareerDatabase } from "../../../../scripts/career/writer";
import type postgres from "postgres";

describe("Career importer", () => {
  it("requires explicit --commit", () => {
    expect(() => assertCareerCommitFlag([])).toThrow(/data:dry-run:career/);
    expect(() => assertCareerCommitFlag(["--apply"])).toThrow(/--commit/);
    expect(() => assertCareerCommitFlag(["--commit"])).not.toThrow();
  });
  it("imports in one transaction, chunks large child datasets and is idempotent", async () => {
    const dataset = careerFixture(); const db = memoryCareerDatabase();
    const first = await executeCareerImport(dataset, db.database);
    expect(db.transactions()).toBe(1);
    expect(first.totalInserts).toBe(first.expectedTotal);
    expect(first.totalUpdates).toBe(0);
    for (const table of ["career_professions", "career_profile_items"]) {
      const batches = db.writes.filter((write) => write.table === table);
      expect(batches.length).toBeGreaterThan(1);
      expect(batches.every((batch) => batch.count <= 300)).toBe(true);
    }
    const writes = db.writes.length;
    const before = db.snapshot();
    const second = await executeCareerImport(dataset, db.database);
    expect(second.totalInserts).toBe(0); expect(second.totalUpdates).toBe(0);
    expect(second.totalUnchanged).toBe(second.expectedTotal);
    expect(db.writes.length).toBe(writes); expect(db.snapshot()).toEqual(before);
  });
  it("updates only different fields while preserving unexpected and out-of-scope rows", async () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.contents[0].values.title = "old";
    snapshot.rows.career_professions.push({ key: "extra", values: { content_id: "outside-career-target", name: "keep" } });
    snapshot.rows.sources.push({ key: "other-source", values: { name: "keep" } });
    const db = memoryCareerDatabase(snapshot);
    const report = await executeCareerImport(dataset, db.database);
    expect(report.totalUpdates).toBe(1); expect(report.totalInserts).toBe(0);
    expect(db.writes).toEqual([{ table: "contents", count: 1 }]);
    expect(db.snapshot().rows.sources.at(-1)).toEqual(snapshot.rows.sources.at(-1));
    expect(db.snapshot().rows.career_professions.at(-1)).toEqual(snapshot.rows.career_professions.at(-1));
  });
  it("rolls back parent inserts, prior updates and successful batches when a later batch fails", async () => {
    const dataset = careerFixture(); const initial = careerSnapshot();
    initial.rows.sources = careerSnapshot(dataset).rows.sources.slice(0, 1);
    initial.rows.sources[0].values.description = "prior description";
    // Batch 6 is the second professions batch, after sources/categories/contents/links.
    const db = memoryCareerDatabase(initial, 6);
    await expect(executeCareerImport(dataset, db.database)).rejects.toThrow("CAREER_BATCH_WRITE_FAILED");
    expect(db.transactions()).toBe(1); expect(db.rollbacks()).toBe(1);
    expect(db.snapshot()).toEqual(initial);
    expect(db.writes.at(-1)?.table).toBe("career_professions");
  });
  it("aborts before any write on preflight conflict", async () => {
    const dataset = careerFixture(); const initial = careerSnapshot(dataset);
    initial.rows.contents[0].values.type = "article";
    const db = memoryCareerDatabase(initial);
    await expect(executeCareerImport(dataset, db.database)).rejects.toThrow("CAREER_PREFLIGHT_FAILED");
    expect(db.writes).toEqual([]); expect(db.rollbacks()).toBe(1);
  });
  it("rejects a batch count mismatch and rolls back the transaction", async () => {
    const transaction = vi.fn(async (work) => work({ readSnapshot: async () => careerSnapshot(), writeBatch: async () => 0 }));
    await expect(executeCareerImport(careerFixture(), { transaction })).rejects.toThrow("CAREER_BATCH_ROW_COUNT_MISMATCH");
  });
  it("caps parameter counts even for wider rows", () => {
    const rows = Array.from({ length: 2477 }, (_, index) => index);
    const chunks = chunkCareerRecords(rows, 400);
    expect(chunks.flat()).toEqual(rows);
    expect(chunks.every((batch) => batch.length * 400 <= 60000)).toBe(true);
    expect(() => chunkCareerRecords(rows, 0)).toThrow();
    expect(() => chunkCareerRecords(rows, 7, 0)).toThrow();
  });
  it("SQL writer uses natural-key upsert and IS DISTINCT FROM without deletes", async () => {
    const dataset = careerFixture();
    const plan = createCareerDryRunPlan(dataset, careerSnapshot());
    const records = plan.tables[0].records.slice(0, 2);
    const unsafe = vi.fn(async () => records.map((row, index) => ({ id: `source-${index}`, slug: row.key })));
    const writer = new PostgresCareerWriter({ unsafe } as unknown as CareerSql, dataset);
    expect(await writer.writeBatch("sources", records)).toBe(2);
    const [query, parameters] = unsafe.mock.calls[0] as unknown as [string, unknown[]];
    expect(query).toContain('ON CONFLICT ("slug")'); expect(query).toContain("IS DISTINCT FROM");
    expect(query).not.toMatch(/\b(DELETE|TRUNCATE)\b/);
    expect(parameters).toHaveLength(18);
    expect(query).not.toContain(String(records[0].values.url));
  });
  it("SQL writer resolves parent IDs and refuses unresolved references before sending SQL", async () => {
    const dataset = careerFixture(); const plan = createCareerDryRunPlan(dataset, careerSnapshot());
    const unsafe = vi.fn(); const writer = new PostgresCareerWriter({ unsafe } as unknown as CareerSql, dataset);
    const records = plan.tables.find((row) => row.table === "career_professions")!.records.slice(0, 1);
    await expect(writer.writeBatch("career_professions", records)).rejects.toThrow(/Missing database reference/);
    expect(unsafe).not.toHaveBeenCalled();
  });
  it("SQL writer refuses keys outside the manifest", async () => {
    const unsafe = vi.fn(); const writer = new PostgresCareerWriter({ unsafe } as unknown as CareerSql, careerFixture());
    await expect(writer.writeBatch("sources", [{ key: "outside", values: {}, action: "insert" }])).rejects.toThrow(/outside manifest/);
    expect(unsafe).not.toHaveBeenCalled();
  });
  it("SQL adapter maps UUIDs through all six natural keys and preserves field payloads", async () => {
    const dataset = careerFixture();
    const snapshot = careerSnapshot(dataset);
    for (const table of ["sources", "content_categories", "contents"] as const) {
      snapshot.rows[table].forEach((row, index) => { row.id = `${table}-uuid-${index}`; });
    }
    const read = vi.spyOn(careerDatabase, "readCareerSnapshot").mockResolvedValue(snapshot);
    const unsafe = vi.fn(async () => []);
    try {
      const writer = new PostgresCareerWriter({ unsafe } as unknown as CareerSql, dataset);
      await writer.readSnapshot();
      const plan = createCareerDryRunPlan(dataset, careerSnapshot());
      for (const table of CAREER_IMPORT_TABLES) {
        const record = plan.tables.find((entry) => entry.table === table)!.records[0];
        await writer.writeBatch(table, [record]);
        const [query, parameters] = unsafe.mock.calls.at(-1) as unknown as [string, unknown[]];
        const columns = careerDatabase.CAREER_NATURAL_COLUMNS[table].map((column) => `"${column}"`).join(", ");
        expect(query).toContain(`ON CONFLICT (${columns})`);
        expect(query).toContain("WHERE target.");
        expect(query).not.toMatch(/\b(DELETE|TRUNCATE)\b/);
        const keys = Object.keys(record.values);
        for (const [field, parent] of [["category_id", "content_categories"], ["content_id", "contents"], ["source_id", "sources"]] as const) {
          if (field in record.values) {
            const expectedId = snapshot.rows[parent].find((row) => row.key === record.values[field])!.id;
            expect(parameters[keys.indexOf(field)]).toBe(expectedId);
          }
        }
        if (table === "contents") expect(parameters[keys.indexOf("metadata")]).toBe("{}");
      }
      expect(unsafe).toHaveBeenCalledTimes(6);
    } finally { read.mockRestore(); }
  });
  it("Postgres transaction adapter propagates failure to driver rollback, never commits", async () => {
    const events: string[] = [];
    const sql = vi.fn(async () => []);
    const client = { begin: vi.fn(async (mode: string, work: (sql: unknown) => Promise<unknown>) => {
      events.push(`BEGIN ${mode}`);
      try { const result = await work(sql); events.push("COMMIT"); return result; }
      catch (error) { events.push("ROLLBACK"); throw error; }
    }) };
    const database = createPostgresCareerDatabase(client as unknown as postgres.Sql<Record<string, never>>, careerFixture());
    await expect(database.transaction(async () => { throw new Error("failed batch"); })).rejects.toThrow("failed batch");
    expect(events).toEqual(["BEGIN isolation level serializable", "ROLLBACK"]);
    expect(client.begin).toHaveBeenCalledTimes(1);
  });
});
