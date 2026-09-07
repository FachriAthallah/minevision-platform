import postgres from "postgres";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { PostgresCareerWriter } from "./writer";
import * as careerDatabase from "./database";
import type { CareerSql } from "./database";
import { careerFixture, careerSnapshot } from "../../src/features/data-ingestion/services/career-import-test-helpers";
import { careerMismatchedFields } from "../../src/features/data-ingestion/services/career-import-model";
import { createCareerDryRunPlan } from "../../src/features/data-ingestion/services/dry-run-career-import";
import { executeCareerImport, type CareerImportDatabase } from "../../src/features/data-ingestion/services/import-career";
import { getCareerImportDiagnostic } from "../../src/features/data-ingestion/services/career-import-diagnostics";

// Construct the lazy driver only to use its installed type codecs. No query is
// executed, and any accidental attempt to open a socket fails the test.
const socket = vi.fn(() => { throw new Error("Database connections forbidden in this test"); });
// The installed runtime supports this socket hook; its Options declaration omits it.
const codecOptions: postgres.Options<Record<string, never>> & { socket: () => never } = { prepare: false, max: 1, socket };
const codecs = postgres(codecOptions);
afterAll(async () => { await codecs.end(); expect(socket).not.toHaveBeenCalled(); });
afterEach(() => vi.restoreAllMocks());

// Model ParameterDescription -> Bind -> jsonb read using Postgres.js codecs.
// PostgreSQL infers text (OID 25) for $n::text::jsonb; a bare parameter in the
// jsonb column, including $n::jsonb, instead resolves to jsonb (OID 3802).
function jsonbRoundTrip(placeholder: string, parameter: unknown): unknown {
  const parameterType = placeholder.endsWith("::text::jsonb") ? 25 : 3802;
  const wire = codecs.options.serializers[parameterType](parameter);
  return codecs.options.parsers[3802](String(wire));
}
function placeholders(query: string) {
  return [...query.split("VALUES ")[1].split("ON CONFLICT")[0].matchAll(/\$(\d+)(?:::[a-z]+)*/g)];
}
const hostile = "'); SELECT pg_sleep(99); -- $999 https://staging.invalid/private \\\" quoted\nKarier 矿业";
const nestedMetadata = { text: hostile, nested: { empty: {}, list: [null, true, false, 0, 4.5, "{}", hostile] } };

describe("Career writer JSONB binding", () => {
  it.each([{}, nestedMetadata])("serializes metadata once with a text-to-jsonb placeholder (case %#)", async (metadata) => {
    const dataset = careerFixture();
    for (const { data } of dataset.categoryFiles) {
      data.profile.metadata = structuredClone(metadata);
      data.profile.body = hostile;
    }
    const snapshot = careerSnapshot(dataset);
    snapshot.rows.content_categories.forEach((row, index) => { row.id = `category-${index}`; });
    vi.spyOn(careerDatabase, "readCareerSnapshot").mockResolvedValue(snapshot);
    const unsafe = vi.fn<(query: string, parameters: unknown[]) => Promise<Record<string, string>[]>>().mockResolvedValue([]);
    const writer = new PostgresCareerWriter({ unsafe } as unknown as CareerSql, dataset);
    await writer.readSnapshot();
    const records = createCareerDryRunPlan(dataset, careerSnapshot()).tables.find((entry) => entry.table === "contents")!.records;
    await writer.writeBatch("contents", records);
    const [query, parameters] = unsafe.mock.calls[0];
    const columns = Object.keys(records[0].values);
    const binds = placeholders(query);
    expect(binds).toHaveLength(parameters.length);
    expect(binds.map((match) => Number(match[1]))).toEqual(parameters.map((_, index) => index + 1));
    for (const [rowIndex, record] of records.entries()) {
      for (const [columnIndex, column] of columns.entries()) {
        const index = rowIndex * columns.length + columnIndex;
        if (column === "metadata") {
          expect(binds[index][0]).toBe(`$${index + 1}::text::jsonb`);
          expect(parameters[index]).toBe(JSON.stringify(metadata));
          expect(parameters[index] === JSON.stringify(JSON.stringify(metadata))).toBe(false);
          const restored = jsonbRoundTrip(binds[index][0], parameters[index]);
          expect(typeof restored).toBe("object");
          expect(restored).toEqual(metadata);
          expect(careerMismatchedFields(record, { ...record, values: { ...record.values, metadata: restored } })).toEqual([]);
        } else {
          expect(binds[index][0]).toBe(`$${index + 1}`);
          const expected = column === "category_id"
            ? snapshot.rows.content_categories.find((row) => row.key === record.values.category_id)!.id
            : record.values[column];
          expect(parameters[index]).toEqual(expected);
        }
      }
    }
    expect(query.includes(hostile)).toBe(false);
    for (const record of records) {
      expect(query.includes(String(record.values.slug))).toBe(false);
      expect(query.includes(String(record.values.title))).toBe(false);
    }
    expect(query.includes("pg_sleep")).toBe(false);
    expect(query.includes("staging.invalid")).toBe(false);
  });

  it("models the original double serialization, including why a jsonb-only cast is insufficient", () => {
    const serialized = JSON.stringify(nestedMetadata);
    expect(jsonbRoundTrip("$1", serialized)).toBe(serialized);
    expect(jsonbRoundTrip("$1::jsonb", serialized)).toBe(serialized);
    expect(jsonbRoundTrip("$1::text::jsonb", serialized)).toEqual(nestedMetadata);
  });

  it.each(["fixed", "legacy"] as const)("preserves post-write verification and rollback in the %s round-trip model", async (mode) => {
    const dataset = careerFixture();
    // Exercise both the current empty object and nested JSON within all 13 targets.
    dataset.categoryFiles[0].data.profile.metadata = structuredClone(nestedMetadata);
    const initial = careerSnapshot(dataset);
    for (const table of ["content_categories", "contents"] as const)
      initial.rows[table].forEach((row, index) => { row.id = `${table}-${index}`; });
    for (const row of initial.rows.contents) row.values.metadata = JSON.stringify(row.values.metadata);
    let committed = structuredClone(initial);
    const events: string[] = [];
    let writes = 0;
    const database: CareerImportDatabase = { transaction: async (work) => {
      const pending = structuredClone(committed);
      vi.spyOn(careerDatabase, "readCareerSnapshot").mockImplementation(async () => structuredClone(pending));
      const unsafe = vi.fn(async (query: string, parameters: unknown[]) => {
        writes++;
        expect(query).toContain('INSERT INTO public."contents"');
        const binds = placeholders(query);
        const columns = Object.keys(pending.rows.contents[0].values);
        const results = [];
        for (let offset = 0; offset < parameters.length; offset += columns.length) {
          const row = pending.rows.contents.find((entry) => entry.values.slug === parameters[offset + columns.indexOf("slug")])!;
          const index = offset + columns.indexOf("metadata");
          row.values.metadata = jsonbRoundTrip(mode === "fixed" ? binds[index][0] : `$${index + 1}`, parameters[index]);
          results.push({ id: row.id!, slug: String(row.values.slug) });
        }
        return results;
      });
      events.push("BEGIN");
      try {
        const report = await work(new PostgresCareerWriter({ unsafe } as unknown as CareerSql, dataset));
        committed = pending; events.push("COMMIT"); return report;
      } catch (error) { events.push("ROLLBACK"); throw error; }
    } };
    if (mode === "legacy") {
      const error = await executeCareerImport(dataset, database).catch((error: unknown) => error);
      expect(getCareerImportDiagnostic(error)).toEqual({ phase: "post_write_verification",
        errorId: "CAREER_POST_WRITE_VERIFICATION_FAILED", tables: [
          { table: "contents", inserts: 0, updates: 13, unchanged: 0, mismatchedFields: ["metadata"] },
        ] });
      expect(events).toEqual(["BEGIN", "ROLLBACK"]);
      expect(committed).toEqual(initial);
    } else {
      const first = await executeCareerImport(dataset, database);
      expect(first.totalUpdates).toBe(13);
      const after = createCareerDryRunPlan(dataset, committed);
      expect(after.passed).toBe(true);
      expect(after.tables.find((entry) => entry.table === "contents")).toMatchObject({ inserts: 0, updates: 0, unchanged: 13 });
      expect(committed.rows.contents.every((row) => typeof row.values.metadata === "object")).toBe(true);
      const second = await executeCareerImport(dataset, database);
      expect(second.totalInserts + second.totalUpdates).toBe(0);
      expect(second.totalUnchanged).toBe(second.expectedTotal);
      expect(writes).toBe(1);
      expect(events).toEqual(["BEGIN", "COMMIT", "BEGIN", "COMMIT"]);
    }
  });
});
